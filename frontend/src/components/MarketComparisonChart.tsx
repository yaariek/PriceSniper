import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Label
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketStats, PricingBands } from '@/lib/api';

interface MarketComparisonChartProps {
    marketStats: MarketStats;
    pricingBands: PricingBands;
    selectedPrice: number;
}

// Standalone error function approximation
function erf(x: number) {
    var m = 1.00;
    var s = 1.00;
    var sum = x * 1.0;
    for (var i = 1; i < 50; i++) {
        m *= i;
        s *= -1;
        sum += (s * Math.pow(x, 2 * i + 1)) / (m * (2 * i + 1));
    }
    return 2 * sum / Math.sqrt(Math.PI);
}

const MarketComparisonChart = ({ marketStats, pricingBands, selectedPrice }: MarketComparisonChartProps) => {
    const data = useMemo(() => {
        const { mean, std_dev, lower_bound, upper_bound } = marketStats;
        const points = [];
        const step = (upper_bound - lower_bound) / 50;

        // Generate bell curve points
        for (let x = lower_bound; x <= upper_bound; x += step) {
            // Normal distribution formula
            const y = (1 / (std_dev * Math.sqrt(2 * Math.PI))) *
                Math.exp(-0.5 * Math.pow((x - mean) / std_dev, 2));
            points.push({ price: x, density: y });
        }
        return points;
    }, [marketStats]);

    // Calculate percentile
    const zScore = (selectedPrice - marketStats.mean) / marketStats.std_dev;
    // Approximation of CDF for normal distribution
    const percentile = Math.round((0.5 * (1 + erf(zScore / Math.sqrt(2)))) * 100);

    const isCheaper = selectedPrice < marketStats.mean;
    const diffPercent = Math.abs(Math.round(((selectedPrice - marketStats.mean) / marketStats.mean) * 100));

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>🎯 The Sniper Scope</CardTitle>
                <CardDescription>
                    Your bid vs. the local market average.
                    <br />
                    <span className={isCheaper ? "text-green-600 font-bold" : "text-orange-600 font-bold"}>
                        You are {diffPercent}% {isCheaper ? "cheaper" : "more expensive"} than the market average.
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="price"
                                tickFormatter={(value) => `£${(value / 1000).toFixed(1)}k`}
                                type="number"
                                domain={['dataMin', 'dataMax']}
                            />
                            <YAxis hide />
                            <Tooltip
                                formatter={() => ["", ""]}
                                contentStyle={{ display: 'none' }}
                                labelFormatter={(label: any) => `Price: £${Math.round(label).toLocaleString()}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="density"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorDensity)"
                            />

                            {/* Market Average Line */}
                            <ReferenceLine x={marketStats.mean} stroke="#666" strokeDasharray="3 3">
                                <Label value="Market Avg" position="top" fill="#666" fontSize={12} />
                            </ReferenceLine>

                            {/* Pricing Bands */}
                            <ReferenceLine x={pricingBands.win_at_all_costs} stroke="#16a34a" strokeWidth={2}>
                                <Label
                                    value="Win"
                                    position="top"
                                    fill="#16a34a"
                                    fontWeight="bold"
                                    fontSize={12}
                                />
                            </ReferenceLine>

                            <ReferenceLine x={pricingBands.balanced} stroke="#2563eb" strokeWidth={2}>
                                <Label
                                    value="Balanced"
                                    position="top"
                                    fill="#2563eb"
                                    fontWeight="bold"
                                    fontSize={12}
                                />
                            </ReferenceLine>

                            <ReferenceLine x={pricingBands.premium} stroke="#9333ea" strokeWidth={2}>
                                <Label
                                    value="Premium"
                                    position="top"
                                    fill="#9333ea"
                                    fontWeight="bold"
                                    fontSize={12}
                                />
                            </ReferenceLine>

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
                    <p>Your selected price is higher than {percentile}% of estimated market bids.</p>
                    <p className="text-xs italic">Source: Aggregated local market data via Valyu AI</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default MarketComparisonChart;
