import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL!;

export interface OrderMessage {
  orderId: string;
  customerId: string;
  restaurantOwnerId: string;
  customerName: string;
  restaurantName: string;
  totalAmount: number;
  items: string[];
}

export async function sendOrderToQueue(order: OrderMessage): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(order),
    MessageAttributes: {
      type: {
        DataType: "String",
        StringValue: "ORDER_CONFIRMED",
      },
    },
  });

  await sqs.send(command);
  console.log(`Order ${order.orderId} sent to SQS queue`);
}
