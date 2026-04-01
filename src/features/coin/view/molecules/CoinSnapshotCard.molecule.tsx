import { Badge, Card, Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

type CoinSnapshotCardProps = {
  contractType?: string | null;
  displayName: string;
  pair?: string | null;
  quoteAsset?: string | null;
  baseAsset?: string | null;
  status?: string | null;
  onboardLabel: string;
  symbol: string;
  displayLastPrice: string;
  displayChange: string;
  displayVolume: string;
};

export default function CoinSnapshotCard({
  contractType,
  displayName,
  pair,
  quoteAsset,
  baseAsset,
  status,
  onboardLabel,
  symbol,
  displayLastPrice,
  displayChange,
  displayVolume,
}: CoinSnapshotCardProps) {
  return (
    <Card
      radius="xl"
      p={{ base: 20, sm: 28 }}
      withBorder
      shadow="xl"
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <Group justify="space-between" align="flex-start" gap="xl">
        <Stack gap="md" maw={720}>
          <Group gap="sm">
            <Badge color="teal" variant="light" size="lg" tt="uppercase">
              {contractType ?? 'FUTURES'}
            </Badge>
            <Badge variant="light" color="gray" size="lg">
              {symbol}
            </Badge>
          </Group>
          <Title order={1} lh={0.95} fw={700}>
            {displayName}
          </Title>
          <Text c="dimmed" fz="lg" lh={1.7}>
            Pair: {pair ?? 'n/a'} · Base asset: {baseAsset ?? 'n/a'} · Quote asset: {quoteAsset ?? 'n/a'}
          </Text>
          <Text fz="md" lh={1.7}>
            Status: {status ?? 'n/a'} · Onboard: {onboardLabel}
          </Text>
        </Stack>

        <Stack gap="sm" miw={260}>
          <Text c="dimmed" size="sm">
            Latest snapshot
          </Text>
          <Card
            radius="lg"
            p="lg"
            withBorder
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Stack gap="sm">
              <Group gap="sm" align="center">
                <ThemeIcon size={44} radius="xl" variant="light" color="teal">
                  {symbol.slice(0, 1)}
                </ThemeIcon>
                <Stack gap={0}>
                  <Text fw={700} fz="xl">
                    {displayLastPrice}
                  </Text>
                  <Text c="teal" fw={600}>
                    {displayChange}
                  </Text>
                </Stack>
              </Group>
              <Divider color="rgba(255,255,255,0.08)" />
              <Text size="sm" c="dimmed">
                24h quote volume
              </Text>
              <Text fw={600}>{displayVolume}</Text>
            </Stack>
          </Card>
        </Stack>
      </Group>
    </Card>
  );
}
