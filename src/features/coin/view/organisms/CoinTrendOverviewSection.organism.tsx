import type { ComponentType } from 'react';
import { Card, Divider, Stack } from '@mantine/core';
import CoinTrendReasonList from '../atoms/CoinTrendReasonList.atom';
import CoinTrendOverviewBadges from '../molecules/CoinTrendOverviewBadges.molecule';
import CoinTrendOverviewHeader from '../molecules/CoinTrendOverviewHeader.molecule';
import CoinTrendOverviewStats from '../molecules/CoinTrendOverviewStats.molecule';
import type { CoinTrendSummary } from '../../interface/CoinView.interface';

type CoinTrendOverviewSectionProps = {
  trendSummary: CoinTrendSummary;
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
        atr14={trendSummary.atr14}
        endPrice={trendSummary.endPrice}
        rangePercent={trendSummary.rangePercent}
        rsi14={trendSummary.rsi14}
        startPrice={trendSummary.startPrice}
      />

      <Divider color="rgba(255,255,255,0.08)" my="md" />

      <Stack gap="sm">
        <CoinTrendOverviewBadges
          atr14={trendSummary.atr14}
          color={trendSummary.color}
          ma20={trendSummary.ma20}
          ma50={trendSummary.ma50}
          ma200={trendSummary.ma200}
          rsi14={trendSummary.rsi14}
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
