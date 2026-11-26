from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import GroupKFold

root = Path(__file__).resolve().parents[1]
input_file = root / "data/processed/country_year_panel.csv"
output_file = root / "frontend/src/data/fertility_trend.json"

data = pd.read_csv(input_file)
period = data[data["year"].between(1990, 2024)]

complete_years = period.groupby("iso3")["core_complete"].sum()
country_codes = complete_years[complete_years == 35].index
sample = period[period["iso3"].isin(country_codes)]

trend = sample.groupby("year")["fertility"].median()
trend = trend.round(3).reset_index()

output_file.parent.mkdir(parents=True, exist_ok=True)
trend.to_json(output_file, orient="records", indent=2)

print("Countries:", sample["iso3"].nunique())
print("Country-year rows:", len(sample))
print("Years in JSON:", len(trend))
print("Saved:", output_file)

scatter_data = sample[
    ["iso3", "country", "region", "year", "fertility", "gdp_pc", "mortality"]
]

scatter_file = root / "frontend/src/data/country_year.json"
scatter_data.to_json(scatter_file, orient="records", indent=2)

print("Scatterplot rows:", len(scatter_data))
print("Saved:", scatter_file)

# Three yearly medians for the main 1990-2024 sample.
trends = sample.groupby("year")[["fertility", "mortality", "gdp_pc"]].median()
trends = trends.round(3).reset_index()
trends_file = root / "frontend/src/data/core_trends.json"
trends.to_json(trends_file, orient="records", indent=2)
print("Saved:", trends_file)

# Education is a separate 2001-2023 sample with all four indicators present.
education = data[data["year"].between(2001, 2023)].dropna(
    subset=["fertility", "gdp_pc", "mortality", "education"]
)
education = education[education["gdp_pc"] > 0]
education_file = root / "frontend/src/data/education_year.json"
education[["iso3", "country", "region", "year", "fertility", "education"]].to_json(
    education_file, orient="records", indent=2
)
print("Education rows:", len(education))
print("Saved:", education_file)

# Checked example from the notebook: Central African Republic and its five
# closest same-region peers on 2001 log GDP, mortality, and education.
peer_codes = ["CAF", "BFA", "RWA", "GIN", "MOZ", "TCD"]
peer_history = data[
    data["iso3"].isin(peer_codes) & data["year"].between(2001, 2023)
]
peer_file = root / "frontend/src/data/peer_history.json"
peer_history[
    ["iso3", "country", "year", "fertility", "gdp_pc", "mortality", "education"]
].to_json(peer_file, orient="records", indent=2)
print("Saved:", peer_file)

# Recalculate the model comparison using the same settings as notebook section 5.
model_data = data[data["year"].between(2001, 2023)].dropna(
    subset=["fertility", "gdp_pc", "mortality", "education"]
).copy()
model_data = model_data[model_data["gdp_pc"] > 0].copy()
model_data["log_gdp"] = np.log(model_data["gdp_pc"])

folds = list(GroupKFold(n_splits=5).split(model_data, groups=model_data["iso3"]))
models = {
    "All three indicators": ["log_gdp", "mortality", "education"],
    "Without GDP": ["mortality", "education"],
    "Without education": ["log_gdp", "mortality"],
    "Without mortality": ["log_gdp", "education"],
}

scores = []
baseline_errors = []
for train_ids, test_ids in folds:
    train = model_data.iloc[train_ids]
    test = model_data.iloc[test_ids]
    baseline_errors.append(mean_absolute_error(
        test["fertility"], [train["fertility"].median()] * len(test)
    ))
scores.append({"name": "Median baseline", "mae": sum(baseline_errors) / 5})

for name, columns in models.items():
    errors = []
    for train_ids, test_ids in folds:
        train = model_data.iloc[train_ids]
        test = model_data.iloc[test_ids]
        model = RandomForestRegressor(
            n_estimators=200, min_samples_leaf=5, random_state=42
        )
        model.fit(train[columns], train["fertility"])
        errors.append(mean_absolute_error(
            test["fertility"], model.predict(test[columns])
        ))
    scores.append({"name": name, "mae": sum(errors) / 5})

model_file = root / "frontend/src/data/model_scores.json"
pd.DataFrame(scores).round(3).to_json(model_file, orient="records", indent=2)
print("Model comparison rows:", len(scores))
print("Saved:", model_file)
