import unittest
from datetime import date

from ZRA_calculator import calculate_tax_readiness


class TaxReadinessTests(unittest.TestCase):
    def setUp(self):
        self.today = date(2026, 11, 21)

    def test_owner_withdrawal_is_excluded_from_profit_and_deductions(self):
        rows = [
            {"status": "confirmed", "type": "income", "category": "Sales", "amount": 1_000, "date": "2026-11-21"},
            {"status": "confirmed", "type": "expense", "category": "Stock purchases", "amount": 300, "date": "2026-11-21"},
            {"status": "confirmed", "type": "expense", "category": "Rent", "amount": 100, "taxDeductible": True, "date": "2026-11-21"},
            {"status": "confirmed", "type": "owner_withdrawal", "category": "Owner personal withdrawal", "amount": 500, "date": "2026-11-21"},
        ]
        result = calculate_tax_readiness(rows, {"legalForm": "sole_trader", "taxActivity": "retail_trading", "vatStatus": "no"}, self.today)
        self.assertEqual(result["accounting"]["grossProfit"], 700.00)
        self.assertEqual(result["accounting"]["netProfit"], 600.00)
        self.assertEqual(result["accounting"]["ownerWithdrawalsExcluded"], 1)
        self.assertEqual(result["accounting"]["allowableOperatingExpenses"], 100.00)

    def test_turnover_scenarios_use_rules_file_floor_and_rate(self):
        rows = [{"status": "confirmed", "type": "income", "category": "Sales", "amount": 10_000, "date": "2026-11-21"}]
        result = calculate_tax_readiness(rows, {"legalForm": "sole_trader", "taxActivity": "retail_trading", "vatStatus": "no"}, self.today)
        self.assertEqual(result["turnover"]["annualized"], 40_555.56)
        self.assertEqual(result["turnover"]["excessOnly"], 527.78)
        self.assertEqual(result["turnover"]["fullTurnover"], 2_027.78)

    def test_input_vat_requires_smart_invoice_tpin_and_recent_invoice(self):
        rows = [
            {"status": "confirmed", "type": "income", "category": "Sales", "amount": 1_160, "date": "2026-11-21", "vatTreatment": "standard_rated"},
            {"status": "confirmed", "type": "expense", "category": "Stock purchases", "amount": 580, "date": "2026-11-21", "smartInvoiceValid": True, "supplierTpinVerified": True, "inputVatAmount": 50, "inputInvoiceDate": "2026-11-21"},
            {"status": "confirmed", "type": "expense", "category": "Stock purchases", "amount": 580, "date": "2026-11-21", "smartInvoiceValid": False, "supplierTpinVerified": True, "inputVatAmount": 99, "inputInvoiceDate": "2026-11-21"},
        ]
        result = calculate_tax_readiness(rows, {"legalForm": "sole_trader", "taxActivity": "retail_trading", "vatStatus": "yes", "vatRegistrationType": "voluntary"}, self.today)
        self.assertEqual(result["vat"]["inputInvoiceCount"], 1)
        self.assertEqual(result["vat"]["inputVat"], 50.00)
        self.assertEqual(result["vat"]["outputVat"], 160.00)
        self.assertEqual(result["vat"]["vatPayableIllustration"], 110.00)

    def test_company_mat_floor_is_applied_only_when_income_tax_regime_is_required(self):
        rows = [
            {"status": "confirmed", "type": "income", "category": "Sales", "amount": 2_000_000, "date": "2026-11-21"},
            {"status": "confirmed", "type": "expense", "category": "Stock purchases", "amount": 2_000_000, "date": "2026-11-21"},
        ]
        result = calculate_tax_readiness(rows, {"legalForm": "limited_company", "taxActivity": "retail_trading", "vatStatus": "no"}, self.today)
        self.assertGreater(result["turnover"]["annualized"], 5_000_000)
        self.assertEqual(result["incomeTax"]["estimatedTax"], 81_111.11)
        self.assertEqual(result["incomeTax"]["minimumAlternativeTax"], 81_111.11)


if __name__ == "__main__":
    unittest.main()

