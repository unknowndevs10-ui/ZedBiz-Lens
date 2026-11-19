/*
 * Small, synthetic training examples for the Agent Lab's local intent matcher.
 * This is demo data, not user data or an AI model. Add human-reviewed examples
 * here as the team learns the phrases business owners actually use.
 */
window.ZEDBIZ_PHRASES = [
  {
    intent: 'sale',
    examples: [
      'I sold goods for K120', 'I sold bread for K120', 'customer paid me K80',
      'I made a sale of K500', 'I earned K250 from sales', 'I received K400 from customers',
      'today sales are K900', 'sold airtime worth K100', 'I got K60 from a customer',
      'money came in from selling vegetables', 'a customer bought groceries for K320',
      'I have income from sales of K700'
    ],
    anchors: ['sell', 'sold', 'sale', 'sales', 'customer', 'earned', 'income', 'received', 'made']
  },
  {
    intent: 'expense',
    examples: [
      'I spent K35 on transport', 'I bought stock for K600', 'paid rent of K1200',
      'I paid the supplier K500', 'transport cost me K40', 'business expense K90 for airtime',
      'I purchased cooking oil for K250', 'I used K70 for fuel', 'paid K55 for a bus',
      'stock purchases were K800', 'I paid for electricity K130', 'money went out for shop supplies'
    ],
    anchors: ['spend', 'spent', 'bought', 'purchase', 'purchased', 'expense', 'paid', 'cost', 'rent', 'fuel', 'transport', 'bill']
  },
  {
    intent: 'summary',
    examples: [
      'How much did I make today', 'show my sales for today', 'what were my expenses today',
      'give me a business summary', 'how much cash came in', 'total sales and expenses',
      'what did I spend today', 'show today business totals', 'how is my business doing',
      'tell me my sales and costs', 'what is my cash movement', 'summarize my records'
    ],
    anchors: ['summary', 'summarize', 'total', 'totals', 'show', 'how', 'much', 'today', 'overview', 'doing', 'balance']
  }
];

