import { Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import type { HomeCoinsSortControlProps } from '../../interface/HomeCoinsSection.interface';

export default function HomeCoinsSortControl({ setActivePage, setSortMode, sortMode }: HomeCoinsSortControlProps) {
  return (
    <Stack gap={6} align="flex-end" style={{ flex: '1 1 320px' }}>
      <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: 1.2 }}>
        Sort by
      </Text>
      <Paper
        radius="lg"
        p={6}
        withBorder
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
          width: '100%',
          maxWidth: 360,
        }}
      >
        <SegmentedControl
          fullWidth
          value={sortMode}
          onChange={(value) => {
            setSortMode(value as typeof sortMode);
            setActivePage(1);
          }}
          data={[
            { label: 'Volume', value: 'volume' },
            { label: 'Gainers', value: 'gainers' },
            { label: 'Losers', value: 'losers' },
          ]}
          color="teal"
          radius="lg"
          size="sm"
          transitionDuration={180}
          withItemsBorders={false}
          autoContrast
          styles={{
            root: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
            control: {
              border: 'none',
            },
            indicator: {
              borderRadius: 999,
              boxShadow: '0 8px 24px rgba(54, 195, 170, 0.22)',
            },
            label: {
              fontWeight: 700,
              letterSpacing: '0.01em',
            },
            innerLabel: {
              paddingInline: 12,
            },
          }}
        />
      </Paper>
    </Stack>
  );
}
