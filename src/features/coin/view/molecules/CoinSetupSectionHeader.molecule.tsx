import { Badge, Group, Stack, Text, Title } from '@mantine/core';

type CoinSetupSectionHeaderProps = {
  preferredDirection: 'long' | 'short';
  preferredGrade: 'A+' | 'A' | 'B' | 'C';
  preferredLabel: string;
};

export default function CoinSetupSectionHeader({
  preferredDirection,
  preferredGrade,
  preferredLabel,
}: CoinSetupSectionHeaderProps) {
  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Text c="dimmed" size="sm" tt="uppercase">
          Setup levels
        </Text>
        <Title order={2} fz="h3">
          Long and short setups
        </Title>
        <Text c="dimmed" size="sm" lh={1.5} maw={780}>
          A+ is the highest grade. Entry is shown as a zone, not a single price. The ideal flow is break, retest,
          then rejection.
        </Text>
      </Stack>

      <Stack gap="sm" hiddenFrom="sm">
        <Group gap="sm" wrap="wrap" justify="flex-start">
          <Badge variant="light" color={preferredDirection === 'long' ? 'teal' : 'red'} size="lg">
            {preferredLabel}
          </Badge>
          <Badge variant="light" color="gray">
            Preferred: {preferredGrade}
          </Badge>
        </Group>
      </Stack>

      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xl" visibleFrom="sm">
        <Stack gap={6} style={{ flex: '1 1 360px', minWidth: 0 }}>
          <Text c="dimmed" size="sm" tt="uppercase">
            Setup focus
          </Text>
          <Text c="dimmed" size="sm" lh={1.35}>
            Best scoring setup in the current structure
          </Text>
        </Stack>

        <Stack gap={6} style={{ flex: '0 0 300px', alignItems: 'flex-end' }}>
          <Badge variant="light" color={preferredDirection === 'long' ? 'teal' : 'red'} size="lg">
            {preferredLabel}
          </Badge>
          <Badge variant="light" color="gray">
            Preferred: {preferredGrade}
          </Badge>
        </Stack>
      </Group>
    </Stack>
  );
}
