# ZedBiz Lens language support

## Current behavior

- English is the primary language for transaction parsing, business insights, and tax explanations.
- Bemba and Nyanja preferences can add a short reviewed greeting to the first-run welcome.
- Speech recognition and speech playback depend on the browser and the configured voice provider. A device may not have a Bemba or Nyanja voice; the app must say so instead of silently pretending it does.
- Financial and tax content is not machine-translated. A wrong tax translation could mislead a business owner.

## Phrase sources

- Bemba respectful greeting: “Muli shani mukwai?”; greeting, thanks and farewell phrases are listed in [Zambian Dialects: Words for Sharing](https://zambiahighcommission.ca/wp/wp-content/uploads/launchmagazine2010.pdf).
- Nyanja respectful greeting: “Muli bwanji?”; the same reference lists Nyanja greetings and thanks.
- Regional usage varies. Validate new phrases with Zambian native speakers before presenting them as financial, tax, or legal guidance.

## Expansion plan

1. Build a reviewed phrase glossary with English meaning, language, region, source, and reviewer.
2. Add consent-based correction feedback for transaction phrases; never learn tax treatment from unreviewed notes.
3. Evaluate speech recognition and text-to-speech separately for Bemba and Nyanja using community-reviewed examples and speakers.
4. Keep the original user note, display the parsed draft, and require owner confirmation in every language.
