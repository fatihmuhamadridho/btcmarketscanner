import { Badge, Card, Group, Modal, ScrollArea, Stack, Table, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import type {
  CoinAutoBotTransactionHistoryEntry,
  CoinAutoBotTransactionHistorySummary,
} from '../../interface/CoinView.interface';

type CoinTransactionHistorySectionProps = {
  symbol: string;
  summary: CoinAutoBotTransactionHistorySummary;
  transactionHistory: CoinAutoBotTransactionHistoryEntry[];
};

function colorForPnl(value: string) {
  return value.startsWith('-') ? 'red' : value === 'n/a' ? 'gray' : 'teal';
}

export default function CoinTransactionHistorySection({
  symbol,
  summary,
  transactionHistory,
}: CoinTransactionHistorySectionProps) {
  const [opened, { close, open }] = useDisclosure(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CoinAutoBotTransactionHistoryEntry | null>(null);

  const handleOpen = (item: CoinAutoBotTransactionHistoryEntry) => {
    setSelectedTransaction(item);
    open();
  };

  const handleClose = () => {
    close();
    setSelectedTransaction(null);
  };

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
              Transaction History
            </Text>
            <Text c="dimmed" size="sm">
              Realized PnL events for {symbol} only. This section excludes funding and other income types.
            </Text>
          </Stack>
          <Badge variant="light" color={transactionHistory.length > 0 ? 'cyan' : 'gray'}>
            {transactionHistory.length > 0 ? `${transactionHistory.length} realized PnL` : 'No realized PnL'}
          </Badge>
        </Group>

        <Group gap="sm" wrap="wrap">
          <Badge variant="light" color="teal">
            Total {summary.totalRealizedPnlLabel}
          </Badge>
          <Badge variant="light" color="violet">
            ROI {summary.roiLabel}
          </Badge>
          <Badge variant="light" color="cyan">
            {summary.winCount} win
          </Badge>
          <Badge variant="light" color="red">
            {summary.lossCount} loss
          </Badge>
          <Badge variant="light" color="gray">
            Win rate {summary.winRateLabel}
          </Badge>
        </Group>

        {transactionHistory.length === 0 ? (
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
              No realized PnL history found for this symbol yet.
            </Text>
          </Card>
        ) : (
          <>
            <ScrollArea h={320} type="auto" offsetScrollbars scrollbarSize={8}>
              <Table
                highlightOnHover
                withColumnBorders
                horizontalSpacing="sm"
                verticalSpacing="sm"
                striped
                style={{ minWidth: 980, tableLayout: 'auto' }}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Realized PnL</Table.Th>
                    <Table.Th>ROI</Table.Th>
                    <Table.Th>Asset</Table.Th>
                    <Table.Th>Info</Table.Th>
                    <Table.Th>Tran ID</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transactionHistory.map((item) => (
                    <Table.Tr
                      key={`${symbol}-${item.tranIdLabel}-${item.timeLabel}`}
                      onClick={() => handleOpen(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td>
                        <Text size="sm">{item.timeLabel}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={700} size="sm" c={colorForPnl(item.realizedPnlLabel)}>
                          {item.realizedPnlLabel}
                        </Text>
                      </Table.Td>
                    <Table.Td>
                      <Text fw={700} size="sm" c={colorForPnl(item.roiLabel)}>
                        {item.roiLabel}
                      </Text>
                    </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {item.assetLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" style={{ maxWidth: 320 }}>
                          {item.infoLabel}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {item.tranIdLabel}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Modal opened={opened} onClose={handleClose} centered title="Transaction Detail" size="md">
              {selectedTransaction ? (
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text fw={700}>{selectedTransaction.realizedPnlLabel}</Text>
                    <Badge variant="light" color={colorForPnl(selectedTransaction.roiLabel)}>
                      ROI {selectedTransaction.roiLabel}
                    </Badge>
                  </Group>

                  <Card radius="md" p="sm" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Time
                      </Text>
                      <Text size="sm">{selectedTransaction.timeLabel}</Text>
                    </Stack>
                  </Card>

                  <Card radius="md" p="sm" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Info
                      </Text>
                      <Text size="sm">{selectedTransaction.infoLabel}</Text>
                    </Stack>
                  </Card>

                  <Card radius="md" p="sm" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Asset / Tran ID
                      </Text>
                      <Text size="sm">
                        {selectedTransaction.assetLabel} · {selectedTransaction.tranIdLabel}
                      </Text>
                    </Stack>
                  </Card>

                  <Card radius="md" p="sm" withBorder style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Actual margin at entry
                      </Text>
                      <Text size="sm">
                        {selectedTransaction.actualMarginLabel}
                      </Text>
                    </Stack>
                  </Card>
                </Stack>
              ) : null}
            </Modal>
          </>
        )}
      </Stack>
    </Card>
  );
}
