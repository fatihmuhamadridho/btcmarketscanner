import type { ComponentType } from 'react';
import { Card, Divider, Stack } from '@mantine/core';
import CoinTrendReasonList from '../atoms/CoinTrendReasonList.atom';
import CoinTrendOverviewBadges from '../molecules/CoinTrendOverviewBadges.molecule';
import CoinTrendOverviewHeader from '../molecules/CoinTrendOverviewHeader.molecule';
import CoinTrendOverviewStats from '../molecules/CoinTrendOverviewStats.molecule';

type CoinTrendOverviewSectionProps = {
  trendSummary: {
    changePercent: number;
    color: 'teal' | 'red' | 'gray';
    endPrice: number | null;
    label: string;
    ma20: number | null;
    ma50: number | null;
    ma200: number | null;
    reasons: string[];
    rangePercent: number;
    score: number;
    startPrice: number | null;
    structurePattern: 'HH/HL' | 'LH/LL' | 'Mixed';
    structure: string;
    volumeRatio: number | null;
  };
  TrendIcon: ComponentType<{ size?: number }>;
};

export default function CoinTrendOverviewSection({ trendSummary, TrendIcon }: CoinTrendOverviewSectionProps) {
  return (
    <Card
      radius="lg"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <CoinTrendOverviewHeader
        color={trendSummary.color}
        changePercent={trendSummary.changePercent}
        label={trendSummary.label}
        TrendIcon={TrendIcon}
      />

      <Divider color="rgba(255,255,255,0.08)" my="md" />

      <CoinTrendOverviewStats
        endPrice={trendSummary.endPrice}
        rangePercent={trendSummary.rangePercent}
        startPrice={trendSummary.startPrice}
      />

      <Divider color="rgba(255,255,255,0.08)" my="md" />

      <Stack gap="sm">
        <CoinTrendOverviewBadges
          color={trendSummary.color}
          ma20={trendSummary.ma20}
          ma50={trendSummary.ma50}
          ma200={trendSummary.ma200}
          score={trendSummary.score}
          structure={trendSummary.structure}
          structurePattern={trendSummary.structurePattern}
          volumeRatio={trendSummary.volumeRatio}
        />

        <CoinTrendReasonList reasons={trendSummary.reasons} />
      </Stack>
    </Card>
  );
}
