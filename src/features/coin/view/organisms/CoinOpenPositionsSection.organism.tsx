import { Badge, Button, Card, Group, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconChartBar, IconReceipt2, IconScale } from '@tabler/icons-react';
import type { CoinAutoBotOpenPosition } from '../../interface/CoinView.interface';

type CoinOpenPositionsSectionProps = {
  positions: CoinAutoBotOpenPosition[];
  onClosePosition: (positionSide: 'BOTH' | 'LONG' | 'SHORT') => void;
  symbol: string;
};

function sideColor(value: string) {
  return value === 'LONG' ? 'teal' : value === 'SHORT' ? 'red' : 'gray';
}

function pnlColor(value: string) {
  return value.startsWith('-') ? 'red' : 'teal';
}

export default function CoinOpenPositionsSection({ positions, onClosePosition, symbol }: CoinOpenPositionsSectionProps) {
  const longCount = positions.filter((position) => position.positionSideLabel === 'LONG').length;
  const shortCount = positions.filter((position) => position.positionSideLabel === 'SHORT').length;

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
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Open Positions
            </Text>
            <Text c="dimmed" size="sm">
              Positions already open on Binance for {symbol}. Use the table to scan many positions quickly and close
              one from the Action column.
            </Text>
          </Stack>
          <Badge variant="light" color={positions.length > 0 ? 'teal' : 'gray'}>
            {positions.length > 0 ? `${positions.length} active` : 'No open position'}
          </Badge>
        </Group>

        {positions.length === 0 ? (
          <Card
            radius="md"
            p="md"
            withBorder
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text size="sm" c="dimmed">
              No open position found for this symbol yet. Start the bot or open a Binance position first.
            </Text>
          </Card>
        ) : (
          <Stack gap="md">
            <Group gap="sm" wrap="wrap">
              <Badge variant="light" color="teal">
                <IconScale size={14} /> {longCount} long
              </Badge>
              <Badge variant="light" color="red">
                <IconScale size={14} /> {shortCount} short
              </Badge>
              <Badge variant="light" color="cyan">
                <IconReceipt2 size={14} /> {positions.length} total
              </Badge>
            </Group>

            <ScrollArea h={340} type="auto" offsetScrollbars scrollbarSize={8}>
              <Table
                highlightOnHover
                withColumnBorders
                horizontalSpacing="sm"
                verticalSpacing="sm"
                striped
                style={{ minWidth: 1180 }}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Side</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th>Entry</Table.Th>
                    <Table.Th>Mark</Table.Th>
                    <Table.Th>Liq.</Table.Th>
                    <Table.Th>PnL</Table.Th>
                    <Table.Th>Lev</Table.Th>
                    <Table.Th>Margin</Table.Th>
                    <Table.Th>Notional</Table.Th>
                    <Table.Th>Margin type</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {positions.map((position) => (
                    <Table.Tr
                      key={`${symbol}-${position.positionSideLabel}-${position.entryPriceLabel}-${position.positionAmtLabel}`}
                      style={{
                        backgroundColor:
                          position.positionSideLabel === 'LONG'
                            ? 'rgba(45, 212, 191, 0.05)'
                            : position.positionSideLabel === 'SHORT'
                              ? 'rgba(248, 113, 113, 0.05)'
                              : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <Table.Td>
                        <Badge variant="light" color={sideColor(position.positionSideLabel)}>
                          {position.positionSideLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.positionAmtLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.entryPriceLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.markPriceLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.liquidationPriceLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={pnlColor(position.unrealizedPnlLabel)}>
                          {position.unrealizedPnlLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.leverageLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.isolatedMarginLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {position.notionalLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {position.marginTypeLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          radius="xl"
                          variant="light"
                          color="red"
                          onClick={() => onClosePosition(position.positionSideLabel)}
                        >
                          Close
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Card
              radius="md"
              p="sm"
              withBorder
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Stack gap={4}>
                <Group gap={8} wrap="wrap">
                  <IconChartBar size={16} color="var(--mantine-color-cyan-4)" />
                  <Text size="sm" fw={700}>
                    Reading guide
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  The table layout stays consistent with open orders and makes it easier to compare positions at a
                  glance.
                </Text>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
