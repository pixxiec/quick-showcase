const {getItem, runCustomQuery} = require('@keystonejs/server-side-graphql-client');
const gql = require('fake-tag');
const {
  calculateAggregatesPerCurrency,
  filterLoanAmountsWhere,
  abbreviateWalletAddress,
  TEST_LOAN_REQUEST_IDS,
} = require('../helpers/loans');

const getBorrowerWalletAddressFromLoanRequestId = (keystone) => async (_, {loanRequestId}) => {
  try {
    const loanInfo = [];
    const loanBorrower = await runCustomQuery({
      keystone,
      query: gql`
        query($id: ID!) {
          allLoans(where: {loanRequest: {id: $id}}) {
            borrower {
              id
            }
          }
        }
      `,
      variables: {id: loanRequestId},
      context: keystone.createContext().sudo(),
    });
    loanInfo.push(...loanBorrower.allLoans);

    if (loanInfo.length === 0) {
      const loanRequestBorrower = await runCustomQuery({
        keystone,
        query: gql`
          query($id: ID!) {
            allLoanRequests(where: {id: $id}) {
              borrower {
                id
              }
            }
          }
        `,
        variables: {id: loanRequestId},
        context: keystone.createContext().sudo(),
      });
      loanInfo.push(...loanRequestBorrower.allLoanRequests);
    }

    if (loanInfo.length === 1 && loanInfo[0].borrower && loanInfo[0].borrower.id) {
      const borrowerWalletAddress = await getItem({
        keystone,
        listKey: 'User',
        itemId: loanInfo[0].borrower.id,
        returnFields: 'walletAddress',
      });

      return {selectedAddress: borrowerWalletAddress.walletAddress};
    }
    return {selectedAddress: null};
  } catch (error) {
    console.log(`getBorrowerWalletAddressFromLoanRequestId error: ${JSON.stringify(error)}`);
    return {selectedAddress: null};
  }
};

const getLenderWalletAddressFromLoanRequestId = (keystone) => async (_, {loanRequestId}) => {
  try {
    const loanInfo = [];
    const loanLender = await runCustomQuery({
      keystone,
      query: gql`
        query($id: ID!) {
          allLoans(where: {loanRequest: {id: $id}}) {
            lender {
              id
            }
          }
        }
      `,
      variables: {id: loanRequestId},
      context: keystone.createContext().sudo(),
    });
    loanInfo.push(...loanLender.allLoans);

    if (loanInfo.length === 0) {
      const loanOfferLender = await runCustomQuery({
        keystone,
        query: gql`
          query($id: ID!) {
            allLoanOffers(where: {loanRequest: {id: $id}}) {
              lender {
                id
              }
            }
          }
        `,
        variables: {id: loanRequestId},
        context: keystone.createContext().sudo(),
      });
      loanInfo.push(...loanOfferLender.allLoanOffers);
    }

    if (loanInfo.length === 1 && loanInfo[0].lender && loanInfo[0].lender.id) {
      const lenderWalletAddress = await getItem({
        keystone,
        listKey: 'User',
        itemId: loanInfo[0].lender.id,
        returnFields: 'walletAddress',
      });

      return {selectedAddress: lenderWalletAddress.walletAddress};
    }
    return {selectedAddress: null};
  } catch (error) {
    console.log(`getLenderWalletAddressFromLoanRequestId error: ${JSON.stringify(error)}`);
    return {selectedAddress: null};
  }
};

const loanPortfolio = (keystone) => async (_, {allLoansWhere, sortBy, loanAmountsWhere}) => {
  try {
    let variables = null;
    if (allLoansWhere || sortBy) {
      variables = {
        ...(allLoansWhere ? {allLoansWhere} : {}),
        ...(sortBy ? {sortBy} : {}),
      };
    }

    const portfolio = await runCustomQuery({
      keystone,
      query: gql`
        query($allLoansWhere: LoanWhereInput, $sortBy: [SortLoansBy!]) {
          allPortfolioTypes(sortBy: priority_ASC) {
            name
            priority
            filters {
              filter
            }
          }
          allLoans(where: $allLoansWhere, sortBy: $sortBy) {
            id
            loanStatus
            originalLoan {
              id
            }
            lender {
              walletAddress
            }
            borrower {
              walletAddress
              email
              emailValidationToken
            }
            loanTerms {
              createdAt
              fundingAmount
              fundingCurrency
              payoffAmount
              bundleId
              durationInDays
              apr
            }
            loanRequest {
              id
              title
              collateral {
                assets {
                  id
                  image_url
                  isERC20
                  contractIcon
                  contractName
                }
              }
            }
          }
        }
      `,
      variables,
      context: keystone.createContext().sudo(),
    });

    // This is setup via a DB migration, and might be modified in the future.  As a safety, lets provide
    // a reasonable default.
    const publicPortfolioType = portfolio.allPortfolioTypes.length
      ? portfolio.allPortfolioTypes[0].name
      : 'public';

    const filteredLoans = filterLoanAmountsWhere(portfolio.allLoans, loanAmountsWhere);
    for (const loan of filteredLoans) {
      try {
        const borrowerWalletAddr = abbreviateWalletAddress(loan.borrower.walletAddress);
        const lenderWalletAddr = abbreviateWalletAddress(loan.lender.walletAddress);
        loan.loanRequest.description = [
          borrowerWalletAddr && `Borrower ${borrowerWalletAddr}`,
          lenderWalletAddr && `Lender ${lenderWalletAddr}`,
        ]
          .filter(Boolean)
          .join(', ');
      } catch (e) {
        console.log(`Error processing portfolio for loan ${loan.id}.  Skipping record.  ${e}`);
      }
    }

    const aggregateLoans = filteredLoans
      // Exclude specific test loan ids
      .filter((loan) => !TEST_LOAN_REQUEST_IDS.includes(loan?.loanRequest?.id))
      // Assign a portfolio type to each loan
      .map((loan) => {
        const {
          borrower: {email, emailValidationToken},
        } = loan;
        if (email && !emailValidationToken) {
          let bestFit = null;
          let bestFitLength = 0;
          for (const portfolioType of portfolio.allPortfolioTypes) {
            for (const {filter} of portfolioType.filters) {
              if (email.includes(filter) && filter.length > bestFitLength) {
                bestFit = portfolioType.name;
                bestFitLength = filter.length;
              }
            }
          }

          if (bestFit) {
            return {
              ...loan,
              portfolio: bestFit,
            };
          }
        }

        return {
          ...loan,
          portfolio: publicPortfolioType,
        };
      })
      .filter((loan) => loan.portfolio === publicPortfolioType);

    aggregateLoans.forEach((loan) => {
      if (loan.originalLoan) {
        const originalLoan = aggregateLoans.find(
          (originalLoan) => originalLoan.id === loan.originalLoan.id,
        );
        if (!originalLoan) {
          console.log(
            `Warning, processing rolled loan (${loan.id}): originalLoan ${loan.originalLoan.id} refers to unknown Loan`,
          );
        }

        loan.loanRequest.collateral = {...originalLoan?.loanRequest?.collateral};
      }
    });

    const nLoans = aggregateLoans.length;
    const nDefaultedLoans = aggregateLoans.reduce(
      (acc, loan) => (loan.loanStatus === 'Defaulted' ? acc + 1 : acc),
      0,
    );

    const defaultRate = nLoans > 0 ? nDefaultedLoans / nLoans : 0;

    return {
      portfolio: filteredLoans,
      aggregates: {
        perCurrency: calculateAggregatesPerCurrency(aggregateLoans),
        defaultRate: defaultRate + '',
        numberOfLoans: nLoans + '',
      },
    };
  } catch (error) {
    console.log(`getLoanPortfolio error: ${error.message}`);
    return {allLoans: null};
  }
};

module.exports = {
  loanPortfolio,
  getBorrowerWalletAddressFromLoanRequestId,
  getLenderWalletAddressFromLoanRequestId,
};
