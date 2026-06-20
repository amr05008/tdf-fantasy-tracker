"""ISO-3166 alpha-2 country code -> display name, for cycling nations.

Falls back to the raw code when unmapped. Names match the style used in the
app (e.g. 'Britain', 'United States').
"""

_NAMES = {
    "AD": "Andorra", "AR": "Argentina", "AT": "Austria", "AU": "Australia",
    "BE": "Belgium", "BR": "Brazil", "CA": "Canada", "CH": "Switzerland",
    "CO": "Colombia", "CZ": "Czechia", "DE": "Germany", "DK": "Denmark",
    "EC": "Ecuador", "EE": "Estonia", "ER": "Eritrea", "ES": "Spain",
    "FR": "France", "GB": "Britain", "IE": "Ireland", "IT": "Italy",
    "JP": "Japan", "KZ": "Kazakhstan", "LU": "Luxembourg", "LV": "Latvia",
    "MX": "Mexico", "NL": "Netherlands", "NO": "Norway", "NZ": "New Zealand",
    "PL": "Poland", "PT": "Portugal", "RU": "Russia", "RW": "Rwanda",
    "SI": "Slovenia", "SK": "Slovakia", "SE": "Sweden", "UA": "Ukraine",
    "US": "United States", "ZA": "South Africa",
}


def code_to_name(code: str) -> str:
    if not code:
        return code
    return _NAMES.get(code.upper(), code)
