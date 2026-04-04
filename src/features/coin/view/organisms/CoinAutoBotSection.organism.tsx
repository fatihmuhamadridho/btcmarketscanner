import { Badge, Button, Card, Divider, Group, NumberInput, ScrollArea, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBolt, IconPlayerPlay, IconPlayerStop, IconShieldCheck, IconStack2, IconTrendingUp } from '@tabler/icons-react';
import type { CoinAutoBotSectionViewModel } from '../../interface/CoinView.interface';

type CoinAutoBotSectionProps = CoinAutoBotSectionViewModel;

const botStats = [
  {
    icon: IconStack2,
    label: 'Capital allocation',
    valueKey: 'allocationLabel',
  },
  {
    icon: IconShieldCheck,
    label: 'Risk guard',
    value: 'Max 1.5% loss',
  },
  {
    icon: IconTrendingUp,
    label: 'Execution endpoint',
    valueKey: 'executionEndpointLabel',
  },
] as const;

export default function CoinAutoBotSection({
  allocationUnit,
  allocationValue,
  allocationLabel,
  atr14Label,
  botStatusColor,
  botStatusLabel,
  currentPriceLabel,
  direction,
  entryZoneLabel,
  executionBasisLabel,
  executionConsensusLabel,
  executionEndpointLabel,
  leverage,
  isActive,
  isStarting,
  isStopping,
  marketConditionLabel,
  logs,
  notes,
  onAllocationUnitChange,
  onAllocationValueChange,
  onLeverageChange,
  onStart,
  onStop,
  previewLabel,
  rsi14Label,
  riskRewardLabel,
  setupGrade,
  setupLabel,
  stopLossLabel,
  symbol,
  timeframeSummaries,
  takeProfitLabels,
}: CoinAutoBotSectionProps) {
  return (
    <Card
      radius="lg"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        background: 'linear-gradient(180deg, rgba(15, 26, 44, 0.96) 0%, rgba(9, 18, 33, 0.94) 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={6}>
            <Group gap={8} wrap="nowrap">
              <IconBolt size={18} color="var(--mantine-color-cyan-4)" />
              <Title order={2} fz="h3">
                Auto Bot Trading
              </Title>
            </Group>
            <Text c="dimmed" size="sm" maw={760}>
              Live execution skeleton for {symbol}. The active Binance API endpoint is controlled by env, and the bot
              will place actual orders when the multi-timeframe consensus enters the entry zone.
            </Text>
          </Stack>

          <Badge variant="light" color={botStatusColor} radius="xl" size="lg">
            {botStatusLabel}
          </Badge>
        </Group>

        <Divider color="rgba(255,255,255,0.08)" />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {botStats.map((item) => (
            <Card
              key={item.label}
              radius="md"
              p="md"
              withBorder
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Stack gap={8}>
                <Group gap={8} wrap="nowrap">
                  <item.icon size={18} color="var(--mantine-color-cyan-4)" />
                  <Text fw={700}>{item.label}</Text>
                </Group>
                <Text c="dimmed" size="sm">
                  {item.label === 'Capital allocation'
                    ? allocationLabel
                    : item.label === 'Execution endpoint'
                      ? executionEndpointLabel
                      : item.value}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Card
          radius="md"
          p="md"
          withBorder
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={4}>
                <Text fw={700}>Execution consensus</Text>
                <Text c="dimmed" size="sm">
                  {executionConsensusLabel} · multi-timeframe summary from {executionBasisLabel}
                </Text>
              </Stack>
              <Badge variant="light" color={direction === 'long' ? 'teal' : 'red'}>
                {direction.toUpperCase()}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
              {timeframeSummaries.map((item) => (
                <Card
                  key={item.interval}
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    backgroundColor: item.isConsensus ? 'rgba(87, 199, 166, 0.08)' : 'rgba(255,255,255,0.03)',
                    borderColor: item.isConsensus ? 'rgba(87, 199, 166, 0.28)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Group gap={8} wrap="nowrap">
                        <Badge variant="light" color={item.trendColor}>
                          {item.interval}
                        </Badge>
                        {item.isConsensus ? (
                          <Badge variant="filled" color="cyan">
                            Consensus
                          </Badge>
                        ) : null}
                      </Group>
                      <Badge variant="light" color={item.direction === 'long' ? 'teal' : 'red'}>
                        {item.direction.toUpperCase()}
                      </Badge>
                    </Group>

                    <Stack gap={2}>
                      <Text fw={700}>{item.trendLabel}</Text>
                      <Text size="sm" c="dimmed">
                        {item.marketConditionLabel}
                      </Text>
                    </Stack>

                    <Group gap="sm" wrap="wrap">
                      <Badge variant="light" color="gray">
                        Grade {item.setupGrade}
                      </Badge>
                      <Badge variant="light" color="gray">
                        RR {item.riskRewardLabel}
                      </Badge>
                      <Badge variant="light" color="gray">
                        ATR14 {item.atrLabel}
                      </Badge>
                      <Badge variant="light" color="gray">
                        RSI14 {item.rsiLabel}
                      </Badge>
                    </Group>

                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Entry zone
                      </Text>
                      <Text fw={700} size="sm">
                        {item.entryZoneLabel}
                      </Text>
                    </Stack>

                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Stop loss
                      </Text>
                      <Text fw={700} size="sm">
                        {item.stopLossLabel}
                      </Text>
                    </Stack>

                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Take profits
                      </Text>
                      <Group gap={8} wrap="wrap">
                        {item.takeProfitLabels.map((takeProfit) => (
                          <Badge key={takeProfit.label} variant="light" color="gray">
                            {takeProfit.label} {takeProfit.valueLabel}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>

        <Card
          radius="md"
          p="md"
          withBorder
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={4}>
                <Text fw={700}>Execution plan</Text>
                <Text c="dimmed" size="sm">
                  {previewLabel} · {marketConditionLabel}
                </Text>
              </Stack>
              <Group gap="sm" wrap="wrap">
                <Badge variant="light" color={direction === 'long' ? 'teal' : 'red'}>
                  {direction.toUpperCase()}
                </Badge>
                <Badge variant="light" color="gray">
                  Grade {setupGrade}
                </Badge>
                <Badge variant="light" color="gray">
                  RR {riskRewardLabel}
                </Badge>
                <Badge variant="light" color="gray">
                  ATR14 {atr14Label}
                </Badge>
                <Badge variant="light" color="gray">
                  RSI14 {rsi14Label}
                </Badge>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              <Card radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Stack gap={4}>
                  <Text c="dimmed" size="sm">
                    Allocation
                  </Text>
                  <Text fw={700}>{allocationLabel}</Text>
                </Stack>
              </Card>
              <Card radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Stack gap={4}>
                  <Text c="dimmed" size="sm">
                    Leverage
                  </Text>
                  <Text fw={700}>{leverage}x</Text>
                </Stack>
              </Card>
              <Card radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Stack gap={4}>
                  <Text c="dimmed" size="sm">
                    Current price
                  </Text>
                  <Text fw={700}>{currentPriceLabel}</Text>
                </Stack>
              </Card>
              <Card radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Stack gap={4}>
                  <Text c="dimmed" size="sm">
                    Entry zone
                  </Text>
                  <Text fw={700}>{entryZoneLabel}</Text>
                </Stack>
              </Card>
              <Card radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Stack gap={4}>
                  <Text c="dimmed" size="sm">
                    Stop loss
                  </Text>
                  <Text fw={700}>{stopLossLabel}</Text>
                </Stack>
              </Card>
              <Card radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Stack gap={4}>
                  <Text c="dimmed" size="sm">
                    Setup
                  </Text>
                  <Text fw={700}>{setupLabel}</Text>
                </Stack>
              </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {takeProfitLabels.map((item) => (
                <Card key={item.label} radius="md" p="md" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Stack gap={4}>
                    <Text c="dimmed" size="sm">
                      {item.label}
                    </Text>
                    <Text fw={700}>{item.valueLabel}</Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>

            <Stack gap={8}>
              <Group justify="space-between" align="center" wrap="wrap">
                <Text fw={700}>Execution settings</Text>
                <Text size="sm" c="dimmed">
                  Strategy, allocation, and leverage for this bot instance. The Binance endpoint follows env.
                </Text>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
                <Card
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    background: 'linear-gradient(180deg, rgba(43, 31, 11, 0.92) 0%, rgba(24, 22, 13, 0.96) 100%)',
                    borderColor: 'rgba(251, 191, 36, 0.22)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <Stack gap={8}>
                    <Text fw={700} c="yellow.2">
                      Strategy
                    </Text>
                    <Text size="sm" c="dimmed" lh={1.45}>
                      Auto refresh the best consensus until entry fills, then lock onto the open position and let the
                      protection orders handle the exit.
                    </Text>
                  </Stack>
                </Card>

                <Card
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    background: 'linear-gradient(180deg, rgba(12, 34, 30, 0.92) 0%, rgba(11, 21, 23, 0.96) 100%)',
                    borderColor: 'rgba(45, 212, 191, 0.22)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <Stack gap={8}>
                    <Text fw={700} c="teal.2">
                      Allocation
                    </Text>
                    <Stack gap={8}>
                      <SegmentedControl
                        size="sm"
                        fullWidth
                        color="teal"
                        value={allocationUnit}
                        onChange={(value) => onAllocationUnitChange(value === 'usdt' ? 'usdt' : 'percent')}
                        data={[
                          { label: 'Percent', value: 'percent' },
                          { label: 'USDT', value: 'usdt' },
                        ]}
                      />
                      <NumberInput
                        min={0.01}
                        max={allocationUnit === 'usdt' ? undefined : 100}
                        decimalScale={2}
                        fixedDecimalScale
                        suffix={allocationUnit === 'usdt' ? ' USDT' : '%'}
                        value={allocationValue}
                        onChange={(value) => onAllocationValueChange(typeof value === 'number' ? value : 12)}
                        styles={{
                          input: {
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            borderColor: 'rgba(45, 212, 191, 0.22)',
                            color: 'var(--mantine-color-gray-0)',
                          },
                        }}
                      />
                    </Stack>
                  </Stack>
                </Card>

                <Card
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 17, 43, 0.92) 0%, rgba(18, 16, 28, 0.96) 100%)',
                    borderColor: 'rgba(167, 139, 250, 0.22)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <Stack gap={8}>
                    <Text fw={700} c="grape.2">
                      Leverage
                    </Text>
                    <NumberInput
                      size="sm"
                      min={1}
                      max={125}
                      suffix="x"
                      value={leverage}
                      onChange={(value) => onLeverageChange(typeof value === 'number' ? value : 1)}
                      styles={{
                        input: {
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          borderColor: 'rgba(167, 139, 250, 0.22)',
                          color: 'var(--mantine-color-gray-0)',
                        },
                      }}
                    />
                  </Stack>
                </Card>
              </SimpleGrid>
            </Stack>

            <Stack gap={6}>
              <Text fw={700}>Trigger notes</Text>
              {notes.map((note) => (
                <Text key={note} size="sm" c="dimmed" lh={1.5}>
                  • {note}
                </Text>
              ))}
            </Stack>

            <Card
              radius="md"
              p="md"
              withBorder
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="center" wrap="wrap">
                  <Text fw={700}>Execution log</Text>
                  <Badge variant="light" color="gray">
                    {logs.length} events
                  </Badge>
                </Group>

                <ScrollArea h={180} offsetScrollbars scrollbarSize={6}>
                  <Stack gap="xs">
                    {logs.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        No execution logs yet.
                      </Text>
                    ) : (
                      [...logs].reverse().map((entry) => (
                        <Card
                          key={entry.id}
                          radius="md"
                          p="sm"
                          withBorder
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            borderColor: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <Stack gap={2} style={{ minWidth: 0 }}>
                              <Text fw={700} size="sm" c={entry.level === 'error' ? 'red' : entry.level === 'success' ? 'teal' : entry.level === 'warn' ? 'yellow' : 'dimmed'}>
                                {entry.level.toUpperCase()}
                              </Text>
                              <Text size="sm" c="dimmed" lh={1.45}>
                                {entry.message}
                              </Text>
                            </Stack>
                            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </Text>
                          </Group>
                        </Card>
                      ))
                    )}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Card>

            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed">
                {isActive
                  ? `Bot is armed on ${executionBasisLabel} summary and will place actual orders when price enters the consensus entry zone.`
                  : `Start will arm the bot for actual execution on ${executionBasisLabel} summary. The Binance endpoint is controlled by env.`}
              </Text>

              <Group gap="sm" wrap="wrap">
                <Button
                  radius="xl"
                  size="md"
                  leftSection={<IconPlayerPlay size={16} />}
                  color="cyan"
                  variant="light"
                  loading={isStarting}
                  disabled={isStarting || isActive}
                  onClick={onStart}
                >
                  Start auto bot
                </Button>
                <Button
                  radius="xl"
                  size="md"
                  leftSection={<IconPlayerStop size={16} />}
                  color="red"
                  variant="subtle"
                  loading={isStopping}
                  onClick={onStop}
                  disabled={!isActive}
                >
                  Stop
                </Button>
              </Group>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Card>
  );
}
