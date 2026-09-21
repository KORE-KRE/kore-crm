import React, { useState } from "react";

// ---------------------------------------------------------------------
// KORE Tools — standalone calculators for conversations with buyers,
// sellers, landlords and tenants. Nothing here writes to Supabase; every
// field is local component state and resets when you navigate away.
//
// Verified reference figures (update these constants if they change):
// - SARS transfer duty brackets — current for the 2026/2027 tax year.
//   https://mjkinc.co.za/property-transfers/transfer-duty
// - Deeds Office fee sliding scale — effective 1 Apr 2026–28 Feb 2027.
//   https://www.capetownlawyer.co.za/property/conveyancing/fees/deeds-office-fees.php
// - VAT rate — 15% (the announced hikes to 15.5%/16% were reversed
//   before taking effect).
// - Prime lending rate — 10.5% as of Sep 2026, used only as a default
//   starting value on the Bond/Affordability calculators (editable).
// - Commission waterfall — mirrors COMMISSION_FORMULA in App.jsx. Keep
//   the two in sync if Kingstons' tier splits ever change.
// Conveyancing/attorney fees are NOT government-regulated and vary by
// firm, so those are always left as a field the user fills in from their
// own attorney's quote rather than a guessed number.
// ---------------------------------------------------------------------

const fmtR = (v) => "R " + Math.round(Number(v) || 0).toLocaleString("en-ZA");
const fmtPct = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "0.00") + "%";
const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const daysInMonth = (year, month0) => new Date(year, month0 + 1, 0).getDate();

const VAT_RATE = 0.15;

const TRANSFER_DUTY_TABLE = [
  { min: 0, max: 1210000, rate: 0, base: 0 },
  { min: 1210000, max: 1663800, rate: 0.03, base: 0 },
  { min: 1663800, max: 2329300, rate: 0.06, base: 13614 },
  { min: 2329300, max: 2994800, rate: 0.08, base: 53544 },
  { min: 2994800, max: 13310000, rate: 0.11, base: 106784 },
  { min: 13310000, max: Infinity, rate: 0.13, base: 1241456 },
];
function calcTransferDuty(price) {
  const p = Math.max(0, n(price));
  const b = TRANSFER_DUTY_TABLE.find((row) => p <= row.max) || TRANSFER_DUTY_TABLE[TRANSFER_DUTY_TABLE.length - 1];
  return b.base + (p - b.min) * b.rate;
}

const DEEDS_TRANSFER_FEE_TABLE = [
  { max: 100000, fee: 50 }, { max: 200000, fee: 114 }, { max: 300000, fee: 727 },
  { max: 600000, fee: 956 }, { max: 800000, fee: 1346 }, { max: 1000000, fee: 1546 },
  { max: 2000000, fee: 1738 }, { max: 4000000, fee: 2408 }, { max: 6000000, fee: 2922 },
  { max: 8000000, fee: 3480 }, { max: 10000000, fee: 4068 }, { max: 15000000, fee: 4844 },
  { max: 20000000, fee: 5818 }, { max: Infinity, fee: 7751 },
];
const DEEDS_BOND_FEE_TABLE = [
  { max: 150000, fee: 561 }, { max: 300000, fee: 727 }, { max: 600000, fee: 956 },
  { max: 800000, fee: 1346 }, { max: 1000000, fee: 1546 }, { max: 2000000, fee: 1738 },
  { max: 4000000, fee: 2408 }, { max: 6000000, fee: 2922 }, { max: 8000000, fee: 3480 },
  { max: 10000000, fee: 4068 }, { max: 15000000, fee: 4844 }, { max: 20000000, fee: 5818 },
  { max: 30000000, fee: 6781 }, { max: Infinity, fee: 9690 },
];
function calcDeedsOfficeFee(table, amount) {
  const a = Math.max(0, n(amount));
  const row = table.find((r) => a <= r.max) || table[table.length - 1];
  return row.fee;
}

// Mirrors COMMISSION_FORMULA in App.jsx.
const TIER_FORMULA = {
  Yellow: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.25 },
  Blue: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.35 },
  Silver: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.40 },
  Gold: { marketingFeePct: 0.05, listingFeePct: 0.10, agentSharePct: 0.45 },
};

function monthlyBondRepayment(principal, annualRatePct, years) {
  const P = Math.max(0, n(principal));
  const r = n(annualRatePct) / 100 / 12;
  const N = Math.max(0, n(years)) * 12;
  if (P <= 0 || N <= 0) return 0;
  if (r === 0) return P / N;
  return (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
}
function maxLoanFromInstalment(instalment, annualRatePct, years) {
  const M = Math.max(0, n(instalment));
  const r = n(annualRatePct) / 100 / 12;
  const N = Math.max(0, n(years)) * 12;
  if (M <= 0 || N <= 0) return 0;
  if (r === 0) return M * N;
  return (M * (1 - Math.pow(1 + r, -N))) / r;
}

// --- shared field/result primitives (styled with KORE's existing global
// classes, so these inherit the app's look with no new CSS) ------------

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="field-label" style={{ marginTop: 0 }}>{label}</div>
      {children}
      {hint && <div className="lead-sub" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
function MoneyField({ label, value, onChange, hint, placeholder }) {
  const [focused, setFocused] = useState(false);
  const val = Number(value) || 0;
  const display = focused ? (val ? String(val) : "") : (val ? val.toLocaleString("en-ZA") : "");
  return (
    <Field label={label} hint={hint}>
      <div className="req-input-wrap crm-mono">
        <span>R</span>
        <input
          type="text" inputMode="decimal" className="req-input" placeholder={placeholder || "0"}
          value={display}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        />
      </div>
    </Field>
  );
}
function PctField({ label, value, onChange, hint, step }) {
  return (
    <Field label={label} hint={hint}>
      <div className="req-input-wrap crm-mono">
        <input type="number" step={step || "0.01"} className="req-input" value={value} onChange={(e) => onChange(e.target.value)} />
        <span>%</span>
      </div>
    </Field>
  );
}
function NumField({ label, value, onChange, hint, placeholder, step }) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" step={step || "1"} className="req-input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
function SelectField({ label, value, onChange, options, hint }) {
  return (
    <Field label={label} hint={hint}>
      <select className="req-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Field>
  );
}
function DateField({ label, value, onChange, hint }) {
  return (
    <Field label={label} hint={hint}>
      <input type="date" className="req-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
function CheckField({ label, checked, onChange }) {
  return (
    <label className="req-checkbox" style={{ marginTop: 16 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
function Grid({ children, cols }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols || 2}, 1fr)`, gap: 10, marginTop: 16 }}>{children}</div>;
}
function ResultGrid({ children }) {
  return <div className="stat-grid" style={{ marginTop: 18, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>{children}</div>;
}
function Result({ label, value, tone }) {
  const color = tone === "good" ? "var(--sage)" : tone === "bad" ? "var(--clay)" : "var(--ink)";
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value crm-mono" style={{ fontSize: 18, color }}>{value}</div>
    </div>
  );
}
function Note({ children }) {
  return <div className="req-note" style={{ marginTop: 20 }}>{children}</div>;
}

// --- the 16 calculators --------------------------------------------------

function InvestmentYieldCalculator() {
  const [price, setPrice] = useState("");
  const [rental, setRental] = useState("");
  const [expenses, setExpenses] = useState("");
  const annualRental = n(rental) * 12;
  const grossYield = n(price) > 0 ? (annualRental / n(price)) * 100 : 0;
  const netYield = n(price) > 0 ? ((annualRental - n(expenses)) / n(price)) * 100 : 0;
  return (
    <>
      <Grid cols={3}>
        <MoneyField label="Purchase price" value={price} onChange={setPrice} />
        <MoneyField label="Monthly rental income" value={rental} onChange={setRental} />
        <MoneyField label="Estimated annual expenses" value={expenses} onChange={setExpenses} hint="Optional — levies, rates, insurance, management, maintenance" />
      </Grid>
      <ResultGrid>
        <Result label="Annual rental income" value={fmtR(annualRental)} />
        <Result label="Gross yield" value={fmtPct(grossYield)} />
        <Result label="Net yield" value={fmtPct(netYield)} tone={netYield >= 0 ? "good" : "bad"} />
      </ResultGrid>
      <Note>Gross yield ignores running costs — use Gross &amp; Net Rental Yield for a full itemised breakdown, or Rental ROI for cash-on-cash return including financing.</Note>
    </>
  );
}

function BondRepaymentCalculator() {
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rate, setRate] = useState("10.5");
  const [years, setYears] = useState("20");
  const loanAmount = Math.max(0, n(price) - n(deposit));
  const monthly = monthlyBondRepayment(loanAmount, rate, years);
  const totalRepaid = monthly * n(years) * 12;
  const totalInterest = totalRepaid - loanAmount;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Purchase price" value={price} onChange={setPrice} />
        <MoneyField label="Deposit" value={deposit} onChange={setDeposit} hint="Optional" />
        <PctField label="Interest rate (annual)" value={rate} onChange={setRate} hint="Current SA prime is 10.5% — banks quote prime, or prime ± a margin" />
        <NumField label="Loan term (years)" value={years} onChange={setYears} />
      </Grid>
      <ResultGrid>
        <Result label="Loan amount" value={fmtR(loanAmount)} />
        <Result label="Monthly repayment" value={fmtR(monthly)} />
        <Result label="Total repaid over term" value={fmtR(totalRepaid)} />
        <Result label="Total interest paid" value={fmtR(totalInterest)} tone="bad" />
      </ResultGrid>
    </>
  );
}

function AffordabilityCalculator() {
  const [income, setIncome] = useState("");
  const [debt, setDebt] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rate, setRate] = useState("10.5");
  const [years, setYears] = useState("20");
  const [pct, setPct] = useState("30");
  const maxInstalment = Math.max(0, n(income) * (n(pct) / 100) - n(debt));
  const maxLoan = maxLoanFromInstalment(maxInstalment, rate, years);
  const maxPrice = maxLoan + n(deposit);
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Gross monthly household income" value={income} onChange={setIncome} />
        <MoneyField label="Existing monthly debt repayments" value={debt} onChange={setDebt} hint="Car finance, credit cards, other loans" />
        <MoneyField label="Deposit available" value={deposit} onChange={setDeposit} />
        <PctField label="Interest rate (annual)" value={rate} onChange={setRate} />
        <NumField label="Loan term (years)" value={years} onChange={setYears} />
        <PctField label="Affordability %" value={pct} onChange={setPct} hint="Banks typically use 25–33% of gross income" />
      </Grid>
      <ResultGrid>
        <Result label="Max affordable instalment" value={fmtR(maxInstalment)} />
        <Result label="Max loan amount" value={fmtR(maxLoan)} />
        <Result label="Max purchase price" value={fmtR(maxPrice)} tone="good" />
      </ResultGrid>
      <Note>Rule-of-thumb only — each bank runs its own affordability assessment based on full credit history, so treat this as a starting conversation with a buyer, not a pre-approval.</Note>
    </>
  );
}

function TransferBondCostCalculator() {
  const [price, setPrice] = useState("");
  const [bondAmount, setBondAmount] = useState("");
  const [transferAttorneyFee, setTransferAttorneyFee] = useState("");
  const [bondAttorneyFee, setBondAttorneyFee] = useState("");
  const duty = calcTransferDuty(price);
  const deedsTransferFee = calcDeedsOfficeFee(DEEDS_TRANSFER_FEE_TABLE, price);
  const deedsBondFee = n(bondAmount) > 0 ? calcDeedsOfficeFee(DEEDS_BOND_FEE_TABLE, bondAmount) : 0;
  const transferAttorneyVat = n(transferAttorneyFee) * VAT_RATE;
  const bondAttorneyVat = n(bondAttorneyFee) * VAT_RATE;
  const totalTransferCost = duty + deedsTransferFee + n(transferAttorneyFee) + transferAttorneyVat;
  const totalBondCost = n(bondAmount) > 0 ? deedsBondFee + n(bondAttorneyFee) + bondAttorneyVat : 0;
  const grandTotal = totalTransferCost + totalBondCost;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Purchase price" value={price} onChange={setPrice} />
        <MoneyField label="Bond amount" value={bondAmount} onChange={setBondAmount} hint="Leave blank for a cash purchase" />
        <MoneyField label="Transfer attorney fee (ex VAT)" value={transferAttorneyFee} onChange={setTransferAttorneyFee} hint="Ask your conveyancer for a quote — fees aren't regulated and vary by firm" />
        <MoneyField label="Bond registration attorney fee (ex VAT)" value={bondAttorneyFee} onChange={setBondAttorneyFee} hint="Only relevant if a bond amount is entered above" />
      </Grid>
      <div className="panel-head" style={{ padding: "18px 0 8px 0", border: "none" }}><h3>Transfer costs</h3></div>
      <ResultGrid>
        <Result label="Transfer duty (SARS)" value={fmtR(duty)} />
        <Result label="Deeds Office fee" value={fmtR(deedsTransferFee)} />
        <Result label="Attorney fee incl. VAT" value={fmtR(n(transferAttorneyFee) + transferAttorneyVat)} />
        <Result label="Total transfer cost" value={fmtR(totalTransferCost)} tone="bad" />
      </ResultGrid>
      {n(bondAmount) > 0 && (
        <>
          <div className="panel-head" style={{ padding: "18px 0 8px 0", border: "none" }}><h3>Bond registration costs</h3></div>
          <ResultGrid>
            <Result label="Deeds Office fee" value={fmtR(deedsBondFee)} />
            <Result label="Attorney fee incl. VAT" value={fmtR(n(bondAttorneyFee) + bondAttorneyVat)} />
            <Result label="Total bond cost" value={fmtR(totalBondCost)} tone="bad" />
          </ResultGrid>
        </>
      )}
      <ResultGrid>
        <Result label="Grand total (cash needed, excl. deposit)" value={fmtR(grandTotal)} tone="bad" />
      </ResultGrid>
      <Note>Transfer duty and Deeds Office fees are the current statutory SARS/Deeds Registry rates. Attorney fees aren't regulated — enter your conveyancer's actual quote for an accurate total.</Note>
    </>
  );
}

function SellerNetProceedsCalculator() {
  const [price, setPrice] = useState("");
  const [bondSettlement, setBondSettlement] = useState("");
  const [bondCancellationFee, setBondCancellationFee] = useState("");
  const [commPct, setCommPct] = useState("6");
  const [clearanceCosts, setClearanceCosts] = useState("");
  const [complianceCerts, setComplianceCerts] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const commission = n(price) * (n(commPct) / 100);
  const commissionVat = commission * VAT_RATE;
  const totalCosts = n(bondSettlement) + n(bondCancellationFee) + commission + commissionVat + n(clearanceCosts) + n(complianceCerts) + n(otherCosts);
  const netProceeds = n(price) - totalCosts;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Agreed selling price" value={price} onChange={setPrice} />
        <MoneyField label="Outstanding bond settlement" value={bondSettlement} onChange={setBondSettlement} />
        <MoneyField label="Bond cancellation/settlement fee" value={bondCancellationFee} onChange={setBondCancellationFee} hint="Ask the bondholder for the exact figure" />
        <PctField label="Agent commission (ex VAT)" value={commPct} onChange={setCommPct} />
        <MoneyField label="Rates/levy clearance figures" value={clearanceCosts} onChange={setClearanceCosts} />
        <MoneyField label="Compliance certificates" value={complianceCerts} onChange={setComplianceCerts} hint="Electrical, beetle, plumbing, gas — varies by provider" />
        <MoneyField label="Other costs" value={otherCosts} onChange={setOtherCosts} />
      </Grid>
      <ResultGrid>
        <Result label="Commission incl. VAT" value={fmtR(commission + commissionVat)} />
        <Result label="Total deductions" value={fmtR(totalCosts)} tone="bad" />
        <Result label="Net proceeds to seller" value={fmtR(netProceeds)} tone={netProceeds >= 0 ? "good" : "bad"} />
      </ResultGrid>
    </>
  );
}

function CommissionCalculator() {
  const [price, setPrice] = useState("");
  const [commPct, setCommPct] = useState("6");
  const [tier, setTier] = useState("Yellow");
  const [shared, setShared] = useState(false);
  const [split, setSplit] = useState("50");
  const gross = n(price) * (n(commPct) / 100);
  const formula = TIER_FORMULA[tier];
  const afterMarketing = gross * (1 - formula.marketingFeePct);
  const marketingFee = gross - afterMarketing;
  const listingFee = afterMarketing * formula.listingFeePct;
  const afterListing = afterMarketing - listingFee;
  const sellingPool = afterListing * formula.agentSharePct;
  const companyNet = afterListing - sellingPool;
  const p1 = shared ? n(split) : 100;
  const p2 = shared ? 100 - n(split) : 0;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Sale price" value={price} onChange={setPrice} />
        <PctField label="Commission (ex VAT)" value={commPct} onChange={setCommPct} />
        <SelectField label="Selling agent tier" value={tier} onChange={setTier} options={["Yellow", "Blue", "Silver", "Gold"]} />
        <CheckField label="Split with another agent" checked={shared} onChange={setShared} />
        {shared && <PctField label="Primary agent's share of the split" value={split} onChange={setSplit} />}
      </Grid>
      <ResultGrid>
        <Result label="Gross commission (ex VAT)" value={fmtR(gross)} />
        <Result label="Gross commission incl. VAT" value={fmtR(gross * (1 + VAT_RATE))} />
        <Result label="Marketing fee (5%)" value={fmtR(marketingFee)} />
        <Result label="Listing agent fee" value={fmtR(listingFee)} />
        <Result label={shared ? "Primary agent (" + split + "%)" : "Selling agent"} value={fmtR(sellingPool * (p1 / 100))} tone="good" />
        {shared && <Result label={"Shared agent (" + p2 + "%)"} value={fmtR(sellingPool * (p2 / 100))} tone="good" />}
        <Result label="Company net" value={fmtR(companyNet)} />
      </ResultGrid>
      <Note>Mirrors Kingstons' actual commission waterfall: a 5% marketing fee and 10% listing fee off the top, then the selling agent's tier share of what's left.</Note>
    </>
  );
}

function CapitalGrowthCalculator() {
  const [mode, setMode] = useState("project");
  const [price, setPrice] = useState("");
  const [growthRate, setGrowthRate] = useState("6");
  const [years, setYears] = useState("5");
  const [currentValue, setCurrentValue] = useState("");
  const futureValue = n(price) * Math.pow(1 + n(growthRate) / 100, n(years));
  const cagr = n(price) > 0 && n(years) > 0 ? (Math.pow(n(currentValue) / n(price), 1 / n(years)) - 1) * 100 : 0;
  return (
    <>
      <div className="view-toggle" style={{ marginBottom: 4, display: "inline-flex" }}>
        <button className={"toggle-btn " + (mode === "project" ? "active" : "")} onClick={() => setMode("project")}>Project future value</button>
        <button className={"toggle-btn " + (mode === "actual" ? "active" : "")} onClick={() => setMode("actual")}>Work out growth achieved</button>
      </div>
      {mode === "project" ? (
        <>
          <Grid cols={3}>
            <MoneyField label="Purchase price" value={price} onChange={setPrice} />
            <PctField label="Expected annual growth" value={growthRate} onChange={setGrowthRate} />
            <NumField label="Years" value={years} onChange={setYears} />
          </Grid>
          <ResultGrid>
            <Result label="Projected future value" value={fmtR(futureValue)} tone="good" />
            <Result label="Total growth" value={fmtR(futureValue - n(price))} />
            <Result label="Total growth %" value={fmtPct(n(price) > 0 ? (futureValue / n(price) - 1) * 100 : 0)} />
          </ResultGrid>
        </>
      ) : (
        <>
          <Grid cols={3}>
            <MoneyField label="Purchase price" value={price} onChange={setPrice} />
            <MoneyField label="Current value" value={currentValue} onChange={setCurrentValue} />
            <NumField label="Years held" value={years} onChange={setYears} />
          </Grid>
          <ResultGrid>
            <Result label="Total growth" value={fmtR(n(currentValue) - n(price))} />
            <Result label="Total growth %" value={fmtPct(n(price) > 0 ? (n(currentValue) / n(price) - 1) * 100 : 0)} />
            <Result label="Annualised growth (CAGR)" value={fmtPct(cagr)} tone="good" />
          </ResultGrid>
        </>
      )}
    </>
  );
}

function FlipRenovationCalculator() {
  const [price, setPrice] = useState("");
  const [renoCost, setRenoCost] = useState("");
  const [attorneyFee, setAttorneyFee] = useState("");
  const [holdingMonthly, setHoldingMonthly] = useState("");
  const [holdMonths, setHoldMonths] = useState("6");
  const [resaleValue, setResaleValue] = useState("");
  const [sellCommPct, setSellCommPct] = useState("6");
  const [otherSellingCosts, setOtherSellingCosts] = useState("");
  const duty = calcTransferDuty(price);
  const buyingCosts = duty + n(attorneyFee);
  const holdingCosts = n(holdingMonthly) * n(holdMonths);
  const totalInvestment = n(price) + n(renoCost) + buyingCosts + holdingCosts;
  const sellCommission = n(resaleValue) * (n(sellCommPct) / 100) * (1 + VAT_RATE);
  const totalSellingCosts = sellCommission + n(otherSellingCosts);
  const netProfit = n(resaleValue) - totalInvestment - totalSellingCosts;
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Purchase price" value={price} onChange={setPrice} />
        <MoneyField label="Renovation/refurb cost" value={renoCost} onChange={setRenoCost} />
        <MoneyField label="Transfer attorney fee (ex VAT)" value={attorneyFee} onChange={setAttorneyFee} hint="Transfer duty is calculated automatically" />
        <MoneyField label="Monthly holding cost" value={holdingMonthly} onChange={setHoldingMonthly} hint="Bond interest, rates, levies, insurance combined" />
        <NumField label="Months held" value={holdMonths} onChange={setHoldMonths} />
        <MoneyField label="Expected resale value" value={resaleValue} onChange={setResaleValue} />
        <PctField label="Selling agent commission (ex VAT)" value={sellCommPct} onChange={setSellCommPct} />
        <MoneyField label="Other selling costs" value={otherSellingCosts} onChange={setOtherSellingCosts} />
      </Grid>
      <ResultGrid>
        <Result label="Transfer duty (auto)" value={fmtR(duty)} />
        <Result label="Total investment" value={fmtR(totalInvestment)} />
        <Result label="Total selling costs" value={fmtR(totalSellingCosts)} />
        <Result label="Net profit" value={fmtR(netProfit)} tone={netProfit >= 0 ? "good" : "bad"} />
        <Result label="ROI" value={fmtPct(roi)} tone={roi >= 0 ? "good" : "bad"} />
      </ResultGrid>
    </>
  );
}

function LandlordNetIncomeCalculator() {
  const [rental, setRental] = useState("");
  const [managed, setManaged] = useState(true);
  const [mgmtFeePct, setMgmtFeePct] = useState("10");
  const [levies, setLevies] = useState("");
  const [rates, setRates] = useState("");
  const [insurance, setInsurance] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [bondRepayment, setBondRepayment] = useState("");
  const mgmtFee = managed ? n(rental) * (n(mgmtFeePct) / 100) : 0;
  const totalExpenses = mgmtFee + n(levies) + n(rates) + n(insurance) + n(maintenance);
  const netOperatingIncome = n(rental) - totalExpenses;
  const netCashFlow = netOperatingIncome - n(bondRepayment);
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Monthly rental income" value={rental} onChange={setRental} />
        <CheckField label="Kingstons manages this property" checked={managed} onChange={setManaged} />
        {managed && <PctField label="Management fee" value={mgmtFeePct} onChange={setMgmtFeePct} />}
        <MoneyField label="Monthly levies" value={levies} onChange={setLevies} />
        <MoneyField label="Monthly rates & taxes" value={rates} onChange={setRates} />
        <MoneyField label="Monthly insurance" value={insurance} onChange={setInsurance} />
        <MoneyField label="Monthly maintenance reserve" value={maintenance} onChange={setMaintenance} />
        <MoneyField label="Monthly bond repayment" value={bondRepayment} onChange={setBondRepayment} hint="Optional — leave blank if cash-owned" />
      </Grid>
      <ResultGrid>
        <Result label="Total monthly expenses" value={fmtR(totalExpenses)} tone="bad" />
        <Result label="Net operating income (monthly)" value={fmtR(netOperatingIncome)} />
        <Result label="Net operating income (annual)" value={fmtR(netOperatingIncome * 12)} />
        <Result label="Net cash flow after bond (monthly)" value={fmtR(netCashFlow)} tone={netCashFlow >= 0 ? "good" : "bad"} />
      </ResultGrid>
    </>
  );
}

function GrossNetRentalYieldCalculator() {
  const [value, setValue] = useState("");
  const [rental, setRental] = useState("");
  const [levies, setLevies] = useState("");
  const [rates, setRates] = useState("");
  const [insurance, setInsurance] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [mgmtFeePct, setMgmtFeePct] = useState("0");
  const annualRental = n(rental) * 12;
  const mgmtFee = annualRental * (n(mgmtFeePct) / 100);
  const annualExpenses = (n(levies) + n(rates) + n(insurance) + n(maintenance)) * 12 + mgmtFee;
  const grossYield = n(value) > 0 ? (annualRental / n(value)) * 100 : 0;
  const netYield = n(value) > 0 ? ((annualRental - annualExpenses) / n(value)) * 100 : 0;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Property value" value={value} onChange={setValue} />
        <MoneyField label="Monthly rental income" value={rental} onChange={setRental} />
        <MoneyField label="Monthly levies" value={levies} onChange={setLevies} />
        <MoneyField label="Monthly rates & taxes" value={rates} onChange={setRates} />
        <MoneyField label="Monthly insurance" value={insurance} onChange={setInsurance} />
        <MoneyField label="Monthly maintenance reserve" value={maintenance} onChange={setMaintenance} />
        <PctField label="Management fee" value={mgmtFeePct} onChange={setMgmtFeePct} hint="Leave at 0 if self-managed" />
      </Grid>
      <ResultGrid>
        <Result label="Annual rental income" value={fmtR(annualRental)} />
        <Result label="Annual expenses" value={fmtR(annualExpenses)} tone="bad" />
        <Result label="Gross yield" value={fmtPct(grossYield)} />
        <Result label="Net yield" value={fmtPct(netYield)} tone={netYield >= 0 ? "good" : "bad"} />
      </ResultGrid>
    </>
  );
}

function TenantMoveInCostCalculator() {
  const [rental, setRental] = useState("");
  const [depositMultiple, setDepositMultiple] = useState("1");
  const [moveInDate, setMoveInDate] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const deposit = n(rental) * n(depositMultiple);
  let prorata = n(rental);
  let daysCharged = null, totalDaysInMonth = null;
  if (moveInDate) {
    const d = new Date(moveInDate + "T00:00:00");
    if (!isNaN(d.getTime())) {
      totalDaysInMonth = daysInMonth(d.getFullYear(), d.getMonth());
      daysCharged = totalDaysInMonth - d.getDate() + 1;
      prorata = (n(rental) / totalDaysInMonth) * daysCharged;
    }
  }
  const total = deposit + prorata + n(adminFee);
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Monthly rental" value={rental} onChange={setRental} />
        <SelectField
          label="Deposit" value={depositMultiple} onChange={setDepositMultiple}
          options={[{ value: "1", label: "1x monthly rental" }, { value: "1.5", label: "1.5x monthly rental" }, { value: "2", label: "2x monthly rental" }]}
        />
        <DateField label="Move-in date" value={moveInDate} onChange={setMoveInDate} hint="Leave blank to assume moving in on the 1st" />
        <MoneyField label="Once-off admin/application fee" value={adminFee} onChange={setAdminFee} hint="Optional" />
      </Grid>
      <ResultGrid>
        <Result label="Deposit" value={fmtR(deposit)} />
        <Result label={daysCharged ? "Pro-rata rent (" + daysCharged + " of " + totalDaysInMonth + " days)" : "First month's rent"} value={fmtR(prorata)} />
        <Result label="Total due at move-in" value={fmtR(total)} tone="good" />
      </ResultGrid>
    </>
  );
}

function ProrataRentalCalculator() {
  const [rental, setRental] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  let result = null;
  if (fromDate && toDate) {
    const from = new Date(fromDate + "T00:00:00");
    const to = new Date(toDate + "T00:00:00");
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && to >= from) {
      const days = Math.round((to - from) / 86400000) + 1;
      const dim = daysInMonth(from.getFullYear(), from.getMonth());
      const dailyRate = n(rental) / dim;
      result = { days, dim, dailyRate, amount: dailyRate * days };
    }
  }
  return (
    <>
      <Grid cols={3}>
        <MoneyField label="Monthly rental" value={rental} onChange={setRental} />
        <DateField label="From date" value={fromDate} onChange={setFromDate} />
        <DateField label="To date" value={toDate} onChange={setToDate} hint="Both dates should fall in the same month" />
      </Grid>
      {result ? (
        <ResultGrid>
          <Result label="Daily rate" value={fmtR(result.dailyRate)} />
          <Result label="Days charged" value={result.days + " of " + result.dim} />
          <Result label="Pro-rata amount" value={fmtR(result.amount)} tone="good" />
        </ResultGrid>
      ) : (
        <Note>Enter a monthly rental and a from/to date to calculate a pro-rata amount — useful for a mid-month move-in, move-out, or refund.</Note>
      )}
    </>
  );
}

function VacancyLossCalculator() {
  const [rental, setRental] = useState("");
  const [vacantDays, setVacantDays] = useState("");
  const annualPotential = n(rental) * 12;
  const dailyRate = annualPotential / 365;
  const annualLoss = dailyRate * n(vacantDays);
  const effectiveAnnual = annualPotential - annualLoss;
  const vacancyRate = (n(vacantDays) / 365) * 100;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Monthly rental (when occupied)" value={rental} onChange={setRental} />
        <NumField label="Vacant days per year" value={vacantDays} onChange={setVacantDays} />
      </Grid>
      <ResultGrid>
        <Result label="Vacancy rate" value={fmtPct(vacancyRate)} />
        <Result label="Annual rental loss" value={fmtR(annualLoss)} tone="bad" />
        <Result label="Effective annual income" value={fmtR(effectiveAnnual)} />
        <Result label="Effective monthly average" value={fmtR(effectiveAnnual / 12)} />
      </ResultGrid>
    </>
  );
}

function RentalIncreaseCalculator() {
  const [current, setCurrent] = useState("");
  const [increasePct, setIncreasePct] = useState("6");
  const [marketRate, setMarketRate] = useState("");
  const newRental = n(current) * (1 + n(increasePct) / 100);
  const rise = newRental - n(current);
  const vsMarket = n(marketRate) > 0 ? ((newRental - n(marketRate)) / n(marketRate)) * 100 : null;
  return (
    <>
      <Grid cols={3}>
        <MoneyField label="Current monthly rental" value={current} onChange={setCurrent} />
        <PctField label="Increase" value={increasePct} onChange={setIncreasePct} hint="Check the lease escalation clause and latest Stats SA CPI — many SA leases use 8–10% p.a. as standard" />
        <MoneyField label="Comparable market rental" value={marketRate} onChange={setMarketRate} hint="Optional sense-check" />
      </Grid>
      <ResultGrid>
        <Result label="Recommended new rental" value={fmtR(newRental)} tone="good" />
        <Result label="Rand increase" value={fmtR(rise)} />
        {vsMarket !== null && <Result label="Vs. comparable market rate" value={(vsMarket >= 0 ? "+" : "") + fmtPct(vsMarket)} tone={Math.abs(vsMarket) <= 5 ? "good" : "bad"} />}
      </ResultGrid>
    </>
  );
}

function ManagementPortfolioRevenueCalculator() {
  const [rows, setRows] = useState([{ id: 1, label: "", rental: "", feePct: "10" }]);
  const addRow = () => setRows((prev) => [...prev, { id: Date.now(), label: "", rental: "", feePct: "10" }]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id, field, value) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const totalRental = rows.reduce((s, r) => s + n(r.rental), 0);
  const totalRevenue = rows.reduce((s, r) => s + n(r.rental) * (n(r.feePct) / 100), 0);
  return (
    <>
      {rows.map((r) => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr auto", gap: 10, marginTop: 16, alignItems: "end" }}>
          <Field label="Property">
            <input type="text" className="req-input" placeholder="e.g. 12 Oak Street" value={r.label} onChange={(e) => updateRow(r.id, "label", e.target.value)} />
          </Field>
          <MoneyField label="Monthly rental" value={r.rental} onChange={(v) => updateRow(r.id, "rental", v)} />
          <PctField label="Mgmt fee" value={r.feePct} onChange={(v) => updateRow(r.id, "feePct", v)} />
          <button className="stage-btn" onClick={() => removeRow(r.id)} disabled={rows.length === 1}>Remove</button>
        </div>
      ))}
      <button className="stage-btn active" style={{ marginTop: 12 }} onClick={addRow}>+ Add property</button>
      <ResultGrid>
        <Result label="Units in portfolio" value={String(rows.length)} />
        <Result label="Total monthly rental managed" value={fmtR(totalRental)} />
        <Result label="Monthly management revenue" value={fmtR(totalRevenue)} tone="good" />
        <Result label="Annual management revenue" value={fmtR(totalRevenue * 12)} tone="good" />
      </ResultGrid>
    </>
  );
}

function RentalROICalculator() {
  const [cashInvested, setCashInvested] = useState("");
  const [annualNetIncome, setAnnualNetIncome] = useState("");
  const [growthPct, setGrowthPct] = useState("");
  const cashOnCash = n(cashInvested) > 0 ? (n(annualNetIncome) / n(cashInvested)) * 100 : 0;
  const totalRoi = cashOnCash + n(growthPct);
  const payback = n(annualNetIncome) > 0 ? n(cashInvested) / n(annualNetIncome) : 0;
  return (
    <>
      <Grid cols={2}>
        <MoneyField label="Total cash invested" value={cashInvested} onChange={setCashInvested} hint="Deposit + buying costs" />
        <MoneyField label="Annual net rental income" value={annualNetIncome} onChange={setAnnualNetIncome} hint="Use the Landlord Net Income calculator to work this out" />
        <PctField label="Expected annual capital growth" value={growthPct} onChange={setGrowthPct} hint="Optional — adds to total ROI" />
      </Grid>
      <ResultGrid>
        <Result label="Cash-on-cash return" value={fmtPct(cashOnCash)} tone={cashOnCash >= 0 ? "good" : "bad"} />
        <Result label="Total ROI (income + growth)" value={fmtPct(totalRoi)} tone={totalRoi >= 0 ? "good" : "bad"} />
        <Result label="Payback period" value={payback > 0 ? payback.toFixed(1) + " years" : "—"} />
      </ResultGrid>
    </>
  );
}

// --- registry + page shell ------------------------------------------------

const CALCULATORS = [
  { id: "investment-yield", name: "Investment Yield Calculator", category: "Investment Analysis", blurb: "Quick gross & net yield on a purchase", Component: InvestmentYieldCalculator },
  { id: "bond-repayment", name: "Bond Repayment Calculator", category: "Buying & Selling", blurb: "Monthly instalment on a home loan", Component: BondRepaymentCalculator },
  { id: "affordability", name: "Affordability / Max Purchase Price", category: "Buying & Selling", blurb: "What a buyer can afford, from income", Component: AffordabilityCalculator },
  { id: "transfer-bond-cost", name: "Transfer & Bond Cost Calculator", category: "Buying & Selling", blurb: "Transfer duty, Deeds Office & attorney costs", Component: TransferBondCostCalculator },
  { id: "seller-net-proceeds", name: "Seller Net Proceeds Calculator", category: "Buying & Selling", blurb: "What a seller walks away with", Component: SellerNetProceedsCalculator },
  { id: "commission", name: "Commission Calculator", category: "Buying & Selling", blurb: "Kingstons' tier-based commission split", Component: CommissionCalculator },
  { id: "capital-growth", name: "Capital Growth Calculator", category: "Investment Analysis", blurb: "Project or work out property appreciation", Component: CapitalGrowthCalculator },
  { id: "flip-renovation", name: "Flip / Renovation Profit Calculator", category: "Investment Analysis", blurb: "All-in profit on a buy-renovate-sell", Component: FlipRenovationCalculator },
  { id: "landlord-net-income", name: "Landlord Net Income Calculator", category: "Rentals & Property Management", blurb: "Monthly cash flow after all expenses", Component: LandlordNetIncomeCalculator },
  { id: "rental-yield", name: "Gross & Net Rental Yield Calculator", category: "Investment Analysis", blurb: "Itemised yield with full running costs", Component: GrossNetRentalYieldCalculator },
  { id: "tenant-move-in", name: "Tenant Cost-to-Move-In Calculator", category: "Rentals & Property Management", blurb: "Deposit + pro-rata rent due upfront", Component: TenantMoveInCostCalculator },
  { id: "prorata-rental", name: "Prorata Rental Calculator", category: "Rentals & Property Management", blurb: "Split a partial month's rent by day", Component: ProrataRentalCalculator },
  { id: "vacancy-loss", name: "Vacancy Loss Calculator", category: "Rentals & Property Management", blurb: "Income lost to empty days per year", Component: VacancyLossCalculator },
  { id: "rental-increase", name: "Rental Increase Recommendation", category: "Rentals & Property Management", blurb: "A defensible new rental at renewal", Component: RentalIncreaseCalculator },
  { id: "portfolio-revenue", name: "Management Portfolio Revenue Calculator", category: "Rentals & Property Management", blurb: "Fee income across a managed portfolio", Component: ManagementPortfolioRevenueCalculator },
  { id: "rental-roi", name: "Rental ROI Calculator", category: "Investment Analysis", blurb: "Cash-on-cash return on a rental purchase", Component: RentalROICalculator },
];
const CATEGORIES = ["Buying & Selling", "Rentals & Property Management", "Investment Analysis"];

export default function ToolsPage() {
  const [activeId, setActiveId] = useState(null);
  const active = CALCULATORS.find((c) => c.id === activeId);

  if (active) {
    const Comp = active.Component;
    return (
      <>
        <button className="stage-btn" style={{ marginBottom: 16 }} onClick={() => setActiveId(null)}>← Back to Tools</button>
        <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
          <h3>{active.name}</h3>
        </div>
        <div className="panel" style={{ padding: 18 }}>
          <Comp />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="req-note" style={{ marginTop: 0, marginBottom: 20 }}>
        Quick calculators for conversations with buyers, sellers, landlords and tenants — nothing here is saved, so figures reset if you navigate away.
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat} style={{ marginBottom: 26 }}>
          <div className="panel-head" style={{ padding: "0 0 10px 0", border: "none" }}>
            <h3>{cat}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
            {CALCULATORS.filter((c) => c.category === cat).map((c) => (
              <button
                key={c.id}
                className="stat-card"
                style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)", width: "100%", display: "block", font: "inherit", color: "inherit" }}
                onClick={() => setActiveId(c.id)}
              >
                <div className="stat-label" style={{ marginBottom: 6 }}>{c.name}</div>
                <div className="lead-sub">{c.blurb}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
