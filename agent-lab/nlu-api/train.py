"""Train a small synthetic-data intent baseline. Metrics are wiring checks only."""
from __future__ import annotations

import csv
import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "synthetic_intents.csv"
ARTIFACTS = ROOT / "artifacts"


def main() -> None:
    with DATA.open(encoding="utf-8", newline="") as source:
        rows = list(csv.DictReader(source))
    texts = [row["text"].strip() for row in rows]
    labels = [row["intent"].strip() for row in rows]
    train_text, test_text, train_labels, test_labels = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    features = FeatureUnion([
        ("words", TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ("characters", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=1, sublinear_tf=True)),
    ])
    model = Pipeline([
        ("features", features),
        ("classifier", LinearSVC(class_weight="balanced", random_state=42)),
    ])
    model.fit(train_text, train_labels)
    predictions = model.predict(test_text)

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACTS / "intent_pipeline.joblib")
    metadata = {
        "model_version": "zedbiz-intent-baseline-0.1.0",
        "labels": sorted(set(labels)),
        "training_data": "synthetic_examples_only",
        "validated_for_real_business_use": False,
        "held_out_split": "random synthetic phrase split; not speaker-separated",
        "sample_count": len(rows),
        "reference_phrases": train_text,
        "abstention_thresholds_validated": False,
        "held_out_macro_f1": round(float(f1_score(test_labels, predictions, average="macro")), 4),
        "report": classification_report(test_labels, predictions, output_dict=True, zero_division=0),
    }
    (ARTIFACTS / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({key:value for key, value in metadata.items() if key != "reference_phrases"}, indent=2))
    print("\nSynthetic-only result. Do not present this score as ZedBiz accuracy.")


if __name__ == "__main__":
    main()
