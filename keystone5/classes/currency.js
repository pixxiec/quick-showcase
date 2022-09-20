/** Class representing an accepted currency */
class Currency {
  static btc = new Currency('Bitcoin', 'BTC', '₿', '₿');
  static cny = new Currency('Yuan', 'CNY', '元', '&#20803;');
  static dog = new Currency('Dogecoin', 'DOGE', 'Ð', 'Ð');
  static eth = new Currency('Ethereum', 'ETH', '♦', '&diams;');
  static eur = new Currency('Euro', 'EUR', '€', '&euro;');
  static gbp = new Currency('British Pound', 'GBP', '£', '&pound;');
  static jpy = new Currency('Japanese Yen', 'JPY', '¥', '&yen;');
  static rub = new Currency('Ruble', 'RUB', '₽', '&#8381;');
  static rup = new Currency('Indian Rupee', 'INR', '₹', '&#8377;');
  static usd = new Currency('US Dollar', 'USD', '$', '&dollar;');

  /** Create a currency object
   * @param {string} name Full name
   * @param {string} iso ISO code
   * @param {string} symbol Symbol
   * @param {string} html HTML entity
   */
  constructor(name, iso, symbol, html) {
    this.name = name;
    this.iso = iso;
    this.symbol = symbol;
    this.html = html;
  }

  /** Returns the currency full name
   * @return {string} Currency full name
   */
  toString() {
    return this.name;
  }
}

module.exports = {
  Currency: Currency,
};
