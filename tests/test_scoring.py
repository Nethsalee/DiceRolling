"""
Unit tests for the Yahtzee scoring logic in app.py.
Run with: python -m pytest tests/
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import score_category, calc_total, new_scorecard


class TestUpperSection:
    def test_ones(self):
        assert score_category([1, 1, 2, 3, 4], 'ones') == 2

    def test_twos(self):
        assert score_category([2, 2, 2, 3, 4], 'twos') == 6

    def test_sixes(self):
        assert score_category([6, 6, 6, 6, 6], 'sixes') == 30

    def test_no_matching(self):
        assert score_category([2, 3, 4, 5, 6], 'ones') == 0


class TestLowerSection:
    def test_three_of_a_kind(self):
        assert score_category([3, 3, 3, 1, 2], 'three_kind') == 12

    def test_three_of_a_kind_fail(self):
        assert score_category([1, 2, 3, 4, 5], 'three_kind') == 0

    def test_four_of_a_kind(self):
        assert score_category([4, 4, 4, 4, 2], 'four_kind') == 18

    def test_full_house(self):
        assert score_category([2, 2, 3, 3, 3], 'full_house') == 25

    def test_full_house_fail(self):
        assert score_category([1, 1, 1, 1, 2], 'full_house') == 0

    def test_small_straight(self):
        assert score_category([1, 2, 3, 4, 6], 'small_straight') == 30

    def test_large_straight(self):
        assert score_category([1, 2, 3, 4, 5], 'large_straight') == 40

    def test_large_straight_high(self):
        assert score_category([2, 3, 4, 5, 6], 'large_straight') == 40

    def test_yahtzee(self):
        assert score_category([5, 5, 5, 5, 5], 'yahtzee') == 50

    def test_yahtzee_fail(self):
        assert score_category([5, 5, 5, 5, 4], 'yahtzee') == 0

    def test_chance(self):
        assert score_category([1, 2, 3, 4, 5], 'chance') == 15


class TestTotals:
    def test_upper_bonus_awarded(self):
        sc = new_scorecard()
        # Minimum to reach 63: sixes * 6 = 36 + threes * 3 = 27 → 63
        sc['sixes'] = 36
        sc['threes'] = 27
        for cat in sc:
            if sc[cat] is None:
                sc[cat] = 0
        total = calc_total(sc)
        assert total == 36 + 27 + 35  # +35 bonus

    def test_upper_bonus_not_awarded(self):
        sc = new_scorecard()
        sc['sixes'] = 12  # only 12, below 63
        for cat in sc:
            if sc[cat] is None:
                sc[cat] = 0
        total = calc_total(sc)
        assert total == 12  # no bonus
