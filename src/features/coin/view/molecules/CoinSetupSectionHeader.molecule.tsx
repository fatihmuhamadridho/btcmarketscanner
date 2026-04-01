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
    <>
      <Group justify="space-between" align="center" wrap="wrap">
        <Stack gap={4}>
          <Text c="dimmed" size="sm" tt="uppercase">
            Setup levels
          </Text>
          <Title order={2} fz="h3">
            Long and short setups
          </Title>
          <Text c="dimmed" size="sm">
            A+ is the highest grade. Entry is shown as a zone, not a single price. The ideal flow is break, retest,
            then rejection.
          </Text>
        </Stack>

        <Group gap="sm" wrap="nowrap">
          <Badge variant="light" color={preferredDirection === 'long' ? 'teal' : 'red'} size="lg">
            {preferredLabel}
          </Badge>
          <Text c="dimmed" size="sm">
            Best scoring setup in the current structure
          </Text>
        </Group>
      </Group>

      <Group justify="space-between" align="center" wrap="wrap" mt="md">
        <Badge variant="light" color="gray">
          Preferred: {preferredGrade}
        </Badge>
      </Group>
    </>
  );
}
