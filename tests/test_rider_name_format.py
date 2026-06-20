from scripts.generate_data import _format_rider_name


def test_reorders_lastname_first():
    assert _format_rider_name("Lipowitz Florian") == "Florian Lipowitz"
    assert _format_rider_name("Pogačar Tadej") == "Tadej Pogačar"


def test_compound_surname_keeps_given_name_last():
    assert _format_rider_name("van Aert Wout") == "Wout van Aert"
    assert _format_rider_name("O'Connor Ben") == "Ben O'Connor"
    assert _format_rider_name("Halland Johannessen Tobias") == "Tobias Halland Johannessen"


def test_single_token_or_empty_unchanged():
    assert _format_rider_name("Madonna") == "Madonna"
    assert _format_rider_name("") == ""
