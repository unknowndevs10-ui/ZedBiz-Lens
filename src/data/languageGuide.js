export const LANGUAGE_OPTIONS = [
  { id: 'English', recognitionLocale: 'en-ZM', speechLocale: 'en-ZA', state: 'primary' },
  { id: 'Bemba', recognitionLocale: 'bem-ZM', speechLocale: 'bem-ZM', state: 'greeting beta' },
  { id: 'Nyanja', recognitionLocale: 'ny-ZM', speechLocale: 'ny-ZM', state: 'greeting beta' },
];

export const LOCAL_GREETINGS = {
  Bemba: { greeting: 'Muli shani mukwai?', translation: 'How are you? (respectful greeting)' },
  Nyanja: { greeting: 'Muli bwanji?', translation: 'How are you? (respectful greeting)' },
};

export const LANGUAGE_SUPPORT_NOTE = 'Bemba and Nyanja greeting support is an early, reviewed phrase set. Business, tax and financial explanations remain in English until local-language wording and speech are validated with native speakers.';

