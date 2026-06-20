from nations import code_to_name


def test_known_codes():
    assert code_to_name("SI") == "Slovenia"
    assert code_to_name("GB") == "Britain"
    assert code_to_name("AU") == "Australia"
    assert code_to_name("US") == "United States"


def test_case_insensitive():
    assert code_to_name("si") == "Slovenia"


def test_unknown_falls_back_to_code():
    assert code_to_name("ZZ") == "ZZ"
    assert code_to_name("") == ""
