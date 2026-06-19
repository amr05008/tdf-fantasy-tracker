from pcs_time import time_str_to_seconds, seconds_to_time_str


def test_hms_to_seconds():
    assert time_str_to_seconds("1:02:03") == 3723
    assert time_str_to_seconds("76:00:32") == 273632


def test_zero_and_garbage():
    assert time_str_to_seconds("0:00:00") == 0
    assert time_str_to_seconds("") == 0
    assert time_str_to_seconds("not a time") == 0


def test_seconds_to_str_roundtrip():
    assert seconds_to_time_str(3723) == "1:02:03"
    assert seconds_to_time_str(0) == "0:00:00"
    assert time_str_to_seconds(seconds_to_time_str(273632)) == 273632
