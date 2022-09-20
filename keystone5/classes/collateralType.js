/** Class representing a collateral type */
class CollateralType {
  static erc721 = new CollateralType('ERC721');
  static erc1151 = new CollateralType('ERC1151');
  static erc20 = new CollateralType('ERC20');

  /** Create a collateral type
   * @param {string} name The collateral type string constant
   * */
  constructor(name) {
    this.name = name;
  }

  /** The collateral type string constant
   * @return {string} The collateral type string constant
   * */
  toString() {
    return this.name;
  }
}

module.exports = {
  CollateralType: CollateralType,
};
