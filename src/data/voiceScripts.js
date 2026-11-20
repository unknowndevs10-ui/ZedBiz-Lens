import { LOCAL_GREETINGS } from './languageGuide';

export function buildWelcomeScript(profile = {}) {
  const greeting = LOCAL_GREETINGS[profile.language]?.greeting;
  const name = String(profile.displayName || '').trim();
  const business = String(profile.businessName || '').trim();
  return [
    `${greeting ? `${greeting} ` : ''}Welcome${name ? `, ${name},` : ''} to ZedBiz Lens${business ? `, your workspace for ${business}` : ''}.`,
    'This platform is being built for the people who keep Zambia moving: market traders, shop owners, independent businesses and growing teams. Running a business means making decisions all day. You serve customers, manage stock, pay expenses and try to remember where every kwacha went. ZedBiz Lens is here to help bring those details into one clearer view.',
    `We start with your business, not a sample company. You have told us about ${business || 'your business'}, how customers pay, what you want to improve and what takes the most work. Those answers help shape the way your workspace presents useful prompts. You can change them as your business grows.`,
    'When something happens, add a sale or expense by typing a note. If your device and browser support speech recognition, you can also speak the note and review the text before saving. ZedBiz prepares a draft, keeps your original words for context and shows the amount, date and category it understood. Please check those details carefully. A draft does not enter your confirmed totals until you approve it.',
    'Your dashboard turns confirmed records into a practical management view: sales, expenses, gross profit, net profit and changes over time. Gross profit subtracts recorded stock purchases from sales. Net profit subtracts all expenses you entered. These are bookkeeping views; they are not the same as taxable profit. The more consistently you record real activity, the more useful the comparisons become. A few entries cannot tell the whole story, so the platform will remind you to check for missing days before relying on a trend.',
    'The business brain can point out patterns in the records you confirm, such as a shift in sales, a large cost category or an entry that needs attention. It explains the records behind each signal. In this pilot, those signals use transparent rules; they are not a human expert or an official government system. They can suggest a question to consider, but they will not edit your books or make decisions for you. You stay in control of every record and every next step.',
    'Your tax view is for preparation and learning. It organizes figures and shows reference indicators, but it does not file a return or determine what you owe. Income tax and VAT need more reviewed information than this pilot currently collects. Tax rules can depend on your activity and current requirements, so confirm important decisions with ZRA or a qualified finance professional.',
    'Please protect your information. Do not include passwords, TPINs, or bank and mobile money credentials in a business note. Your profile is saved to your account. In this pilot, transaction records are saved in this browser, so use the same device and browser when you return. We are working toward a more complete connected record system.',
    'You do not need to set everything up perfectly today. Begin with one real sale or expense. Read the draft, correct anything that needs attention, and confirm it when it is right. Over time, a steady record of real business activity can make it easier to spot questions, plan ahead and explain your numbers with confidence.',
    'Welcome to ZedBiz Lens. Your business. Your numbers. Your next step. Every kwacha has a story. See the whole picture.',
  ].join('\n\n');
}

