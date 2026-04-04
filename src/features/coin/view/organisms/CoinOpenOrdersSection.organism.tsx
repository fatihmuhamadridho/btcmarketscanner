import { Badge, Button, Card, Group, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { IconGauge, IconSwitchHorizontal, IconTarget } from '@tabler/icons-react';
import type { CoinAutoBotOpenOrder } from '../../interface/CoinView.interface';

type CoinOpenOrdersSectionProps = {
  openOrders: CoinAutoBotOpenOrder[];
  onCancelOrder: (order: CoinAutoBotOpenOrder) => void;
  symbol: string;
};

function colorForSide(side: string) {
  return side === 'BUY' ? 'teal' : side === 'SELL' ? 'red' : 'gray';
}

function colorForMode(mode: string) {
  return mode === 'Algo' ? 'cyan' : 'gray';
}

function colorForPurpose(purpose: CoinAutoBotOpenOrder['orderPurposeLabel']) {
  switch (purpose) {
    case 'Entry':
      return 'teal';
    case 'Take profit':
      return 'cyan';
    case 'Stop loss':
      return 'red';
    default:
      return 'gray';
  }
}

export default function CoinOpenOrdersSection({ openOrders, onCancelOrder, symbol }: CoinOpenOrdersSectionProps) {
  const entryOrders = openOrders.filter((item) => item.orderPurposeLabel === 'Entry');
  const tpOrders = openOrders.filter((item) => item.orderPurposeLabel === 'Take profit');
  const slOrders = openOrders.filter((item) => item.orderPurposeLabel === 'Stop loss');

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
              Open Orders
            </Text>
            <Text c="dimmed" size="sm">
              Pending Binance orders for {symbol}. Entry, TP, and SL are shown in one compact list so it stays readable
              even when there are many open orders.
            </Text>
          </Stack>
          <Badge variant="light" color={openOrders.length > 0 ? 'cyan' : 'gray'}>
            {openOrders.length > 0 ? `${openOrders.length} pending` : 'No open order'}
          </Badge>
        </Group>

        {openOrders.length === 0 ? (
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
              No open order found for this symbol.
            </Text>
          </Card>
        ) : (
          <Stack gap="md">
            <Group gap="sm" wrap="wrap">
              <Badge variant="light" color="teal">
                <IconSwitchHorizontal size={14} /> {entryOrders.length} entry
              </Badge>
              <Badge variant="light" color="cyan">
                <IconTarget size={14} /> {tpOrders.length} TP
              </Badge>
              <Badge variant="light" color="red">
                <IconGauge size={14} /> {slOrders.length} SL
              </Badge>
            </Group>

            <ScrollArea h={420} type="auto" offsetScrollbars scrollbarSize={8}>
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
                    <Table.Th>Mode</Table.Th>
                    <Table.Th>Side</Table.Th>
                    <Table.Th>Purpose</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Entry</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Notional</Table.Th>
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {openOrders.map((order) => (
                    <Table.Tr
                      key={`${symbol}-${order.clientOrderId ?? order.orderTypeLabel}-${order.orderModeLabel}`}
                      style={{
                        backgroundColor:
                          order.orderPurposeLabel === 'Entry'
                            ? 'rgba(45, 212, 191, 0.05)'
                            : order.orderPurposeLabel === 'Take profit'
                              ? 'rgba(56, 189, 248, 0.05)'
                              : order.orderPurposeLabel === 'Stop loss'
                                ? 'rgba(248, 113, 113, 0.05)'
                                : undefined,
                      }}
                    >
                      <Table.Td>
                        <Badge variant="light" color={colorForMode(order.orderModeLabel)}>
                          {order.orderModeLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={colorForSide(order.orderSideLabel)}>
                          {order.orderSideLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={colorForPurpose(order.orderPurposeLabel)}>
                          {order.orderPurposeLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {order.orderTypeLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {order.orderStatusLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {order.orderEntryPriceLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {order.orderQuantityLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {order.orderNotionalLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {order.clientOrderId ?? 'n/a'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          radius="xl"
                          variant="light"
                          color={order.orderPurposeLabel === 'Stop loss' ? 'red' : 'gray'}
                          onClick={() => onCancelOrder(order)}
                        >
                          Cancel
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
                <Text size="sm" c="dimmed">
                  Open orders only show pending instructions. TP and SL appear after the entry order fills, so this
                  table is expected to show a pending LIMIT entry first.
                </Text>
                <Text size="sm" c="dimmed">
                  Use the table to scan many orders quickly. The scroll area keeps the section compact even when there
                  are 100+ open orders.
                </Text>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
