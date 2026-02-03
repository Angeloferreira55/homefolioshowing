import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

interface MortgageCalculatorProps {
  propertyPrice: number;
}

const COLORS = {
  principal: 'hsl(var(--primary))',
  interest: 'hsl(var(--muted-foreground))',
  taxes: 'hsl(210, 40%, 60%)',
  insurance: 'hsl(210, 30%, 75%)',
};

export default function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);

  const calculations = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    // Calculate monthly principal & interest payment
    let monthlyPI = 0;
    if (monthlyRate > 0) {
      monthlyPI = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyPI = loanAmount / numPayments;
    }

    // Estimate taxes (1.2% of property value annually) and insurance ($1,200/year)
    const monthlyTaxes = (propertyPrice * 0.012) / 12;
    const monthlyInsurance = 100; // $100/month estimate

    const totalMonthly = monthlyPI + monthlyTaxes + monthlyInsurance;

    // Calculate total interest paid over loan term
    const totalPaid = monthlyPI * numPayments;
    const totalInterest = totalPaid - loanAmount;

    // For the first payment, calculate principal vs interest split
    const firstMonthInterest = loanAmount * monthlyRate;
    const firstMonthPrincipal = monthlyPI - firstMonthInterest;

    return {
      downPayment,
      loanAmount,
      monthlyPI,
      monthlyTaxes,
      monthlyInsurance,
      totalMonthly,
      totalInterest,
      firstMonthPrincipal,
      firstMonthInterest,
    };
  }, [propertyPrice, downPaymentPercent, interestRate, loanTerm]);

  const pieData = [
    { name: 'Principal', value: Math.round(calculations.firstMonthPrincipal), color: COLORS.principal },
    { name: 'Interest', value: Math.round(calculations.firstMonthInterest), color: COLORS.interest },
    { name: 'Taxes', value: Math.round(calculations.monthlyTaxes), color: COLORS.taxes },
    { name: 'Insurance', value: Math.round(calculations.monthlyInsurance), color: COLORS.insurance },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-4 sm:p-5 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
          Mortgage Calculator
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Down Payment
              </Label>
              <span className="text-sm font-medium text-foreground">
                {downPaymentPercent}% ({formatCurrency(calculations.downPayment)})
              </span>
            </div>
            <Slider
              value={[downPaymentPercent]}
              onValueChange={(v) => setDownPaymentPercent(v[0])}
              min={0}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm">
                <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                Interest Rate
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 text-sm text-right"
                  step={0.125}
                  min={0}
                  max={15}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={(v) => setInterestRate(v[0])}
              min={2}
              max={12}
              step={0.125}
              className="w-full"
            />
          </div>

          {/* Loan Term */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Loan Term
              </Label>
              <span className="text-sm font-medium text-foreground">{loanTerm} years</span>
            </div>
            <div className="flex gap-2">
              {[15, 20, 30].map((term) => (
                <button
                  key={term}
                  onClick={() => setLoanTerm(term)}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                    loanTerm === term
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {term} yr
                </button>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-medium text-foreground">{formatCurrency(calculations.loanAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Interest</span>
              <span className="font-medium text-foreground">{formatCurrency(calculations.totalInterest)}</span>
            </div>
          </div>
        </div>

        {/* Chart & Total */}
        <div className="flex flex-col items-center justify-center">
          {/* Monthly Payment Total */}
          <div className="text-center mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Monthly Payment</p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-primary">
              {formatCurrency(calculations.totalMonthly)}
            </p>
          </div>

          {/* Pie Chart */}
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs w-full max-w-[200px]">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        *Estimates based on property taxes at 1.2% and $100/mo insurance. Actual costs may vary.
      </p>
    </Card>
  );
}