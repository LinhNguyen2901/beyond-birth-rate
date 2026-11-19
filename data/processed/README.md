# Processed data

`country_year_panel.csv` is the cleaned economy/year panel used by both notebooks. Missing indicator values remain null. `country_metadata.csv` records the World Bank economy metadata. `cleaning_audit.json` records the current conversion and filtering checks. `indicator_metadata.json` and `download_manifest.json` record indicator definitions, API URLs, and retrieval dates. The normalized raw observation CSV is in `data/raw/`. Older compressed API responses remain there as historical source records; the simplified notebook does not read them.
