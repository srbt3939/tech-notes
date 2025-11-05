# [Using Lambda with Amazon SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)

Amazon Simple Queue Service (Amazon SQS) のキューにあるメッセージを処理するために、Lambda関数を使用することができます。Lambdaのイベントソースマッピングは、標準的なキューと先入れ先出し（FIFO）キューをサポートしています。Amazon SQSを使用すると、キューにタスクを送信して非同期に処理することで、アプリケーションの1つのコンポーネントからタスクをオフロードすることができます。

Lambdaはキューをポーリングし、キューのメッセージを含むイベントと同期してLambda関数を呼び出します。Lambdaはメッセージを一括して読み込み、各バッチに対して1回だけ関数を呼び出します。関数がバッチ処理に成功すると、Lambdaはキューからそのメッセージを削除します。次の例は、2つのメッセージのバッチに対するイベントを示しています。

**Example Amazon SQS message event (standard queue)**
```
{
    "Records": [
        {
            "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
            "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
            "body": "Test message.",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1545082649183",
                "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                "ApproximateFirstReceiveTimestamp": "1545082649185"
            },
            "messageAttributes": {},
            "md5OfBody": "e4e68fb7bd0e697a0ae8f1bb342846b3",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
            "awsRegion": "us-east-2"
        },
        {
            "messageId": "2e1424d4-f796-459a-8184-9c92662be6da",
            "receiptHandle": "AQEBzWwaftRI0KuVm4tP+/7q1rGgNqicHq...",
            "body": "Test message.",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1545082650636",
                "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                "ApproximateFirstReceiveTimestamp": "1545082650649"
            },
            "messageAttributes": {},
            "md5OfBody": "e4e68fb7bd0e697a0ae8f1bb342846b3",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
            "awsRegion": "us-east-2"
        }
    ]
}
```

デフォルトでは、Lambdaはキューにある最大10件のメッセージを一度にポーリングし、そのバッチを関数に送信します。少ないレコード数で関数を呼び出すことを避けるために、バッチウィンドウを設定することで、イベントソースに最大5分間レコードをバッファするように指示することができます。関数を呼び出す前に、Lambdaはバッチウィンドウの期限が切れるか、呼び出しペイロードサイズのクォータに達するか、設定された最大バッチサイズに達するまで、SQS標準キューからメッセージをポーリングし続けます。


> NOTE
> バッチウィンドウを使用していて、SQSキューのトラフィックが非常に少ない場合、Lambdaは関数を呼び出す前に最大で20秒間待つことがあります。これは、バッチウィンドウを20秒より短く設定した場合でも同じです。

FIFO キューの場合、レコードには重複排除と順序付けに関連する追加属性が含まれる。

**Example Amazon SQS message event (FIFO queue)**

```
{
    "Records": [
        {
            "messageId": "11d6ee51-4cc7-4302-9e22-7cd8afdaadf5",
            "receiptHandle": "AQEBBX8nesZEXmkhsmZeyIE8iQAMig7qw...",
            "body": "Test message.",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1573251510774",
                "SequenceNumber": "18849496460467696128",
                "MessageGroupId": "1",
                "SenderId": "AIDAIO23YVJENQZJOL4VO",
                "MessageDeduplicationId": "1",
                "ApproximateFirstReceiveTimestamp": "1573251510774"
            },
            "messageAttributes": {},
            "md5OfBody": "e4e68fb7bd0e697a0ae8f1bb342846b3",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:fifo.fifo",
            "awsRegion": "us-east-2"
        }
    ]
}
```

Lambdaがバッチを読み込むと、メッセージはキューに残りますが、キューの可視性タイムアウトの長さの間、隠されます。関数がバッチの処理に成功すると、Lambdaはキューからメッセージを削除します。デフォルトでは、バッチ処理中にエラーが発生した場合、そのバッチ内のすべてのメッセージが再びキューに表示されるようになります。このため、意図しない副作用を発生させることなく、同じメッセージを複数回処理できることが必要です。この再処理の挙動を変更するには、関数の応答にバッチ項目の失敗を含めます。

**Sections**
- Scaling and processing
- Configuring a queue to use with Lambda
- Execution role permissions
- Configuring a queue as an event source
- Event source mapping APIs
- Reporting batch item failures
- Amazon SQS configuration parameters
- Tutorial: Using Lambda with Amazon SQS
- Tutorial: Using a cross-account Amazon SQS queue as an event source
- Sample Amazon SQS function code
- AWS SAM template for an Amazon SQS application

---
## Reporting batch item failures

Lambda関数がバッチ処理中にエラーに遭遇すると、Lambdaが正常に処理したメッセージも含めて、そのバッチ内のすべてのメッセージがデフォルトで再びキューに表示されるようになります。その結果、関数が同じメッセージを何度も処理することになる可能性があります。

失敗したバッチ内のすべてのメッセージの再処理を避けるために、イベントソースマッピングを設定して、失敗したメッセージのみを再び見えるようにすることができます。これを行うには、イベントソースマッピングを設定する際に、FunctionResponseTypes リストに値 ReportBatchItemFailures を含めます。これにより、関数が部分的な成功を返すようになり、レコードの不要な再試行回数を減らすことができます。

### レポートの構文

イベントソースマッピング構成に ReportBatchItemFailures を含めると、失敗したメッセージ ID のリストを関数レスポンスに返すことができます。たとえば、メッセージ ID が id1, id2, id3, id4, id5 の 5 つのメッセージのバッチがあるとします。この関数は id1, id3, id5 の処理に成功しました。メッセージ id2 と id4 を再びキューに表示するには、以下のようなレスポンス構文を使用します。

```
{ 
  "batchItemFailures": [ 
        {
            "itemIdentifier": "id2"
        },
        {
            "itemIdentifier": "id4"
        }
    ]
}
```

バッチ内の失敗したメッセージ ID のリストを返すには、SQSBatchResponse クラス・オブジェクトを使用するか、独自のカスタム・クラスを作成することができます。以下は、SQSBatchResponse オブジェクトを使用した応答の例です。

```
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.lambda.runtime.events.SQSBatchResponse;
 
import java.util.ArrayList;
import java.util.List;
 
public class ProcessSQSMessageBatch implements RequestHandler<SQSEvent, SQSBatchResponse> {
    @Override
    public SQSBatchResponse handleRequest(SQSEvent sqsEvent, Context context) {
 
         List<SQSBatchResponse.BatchItemFailure> batchItemFailures = new ArrayList<SQSBatchResponse.BatchItemFailure>();
         String messageId = "";
         for (SQSEvent.SQSMessage message : sqsEvent.getRecords()) {
             try {
                 //process your message
                 messageId = message.getMessageId();
             } catch (Exception e) {
                 //Add failed message identifier to the batchItemFailures list
                 batchItemFailures.add(new SQSBatchResponse.BatchItemFailure(messageId));
             }
         }
         return new SQSBatchResponse(batchItemFailures);
     }
}
```

この機能を使用するには、関数がエラーを優雅に処理する必要があります。関数ロジックですべての例外を捕捉し、失敗したメッセージは関数レスポンスの batchItemFailures で報告するようにしてください。関数が例外をスローした場合は、そのバッチは完全に失敗と見なされます。

> NOTE
> この機能を FIFO キューで使用する場合、最初の失敗の後にメッセージの処理を停止し、失敗したメッセージと未処理のメッセージをすべて batchItemFailures で返さなければなりません。これは、キュー内のメッセージの順序を保持するのに役立ちます。

### 成功条件と失敗条件

Lambdaは、関数が以下のいずれかを返した場合、バッチが完全に成功したものとして扱います。
- 空の batchItemFailures リスト
- null batchItemFailuresリスト
- 空のEventResponse
- nullのEventResponse

Lambdaは、以下のいずれかを返した場合、バッチを完全な失敗として扱います。
- 無効なJSONレスポンス
- 空の文字列 itemIdentifier
- nullのitemIdentifier
- 不正なキー名を持つitemIdentifier

### CloudWatch metrics
関数がバッチアイテムの障害を正しく報告しているかどうかを判断するには、Amazon CloudWatchでNumberOfMessagesDeletedと ApproximateAgeOfOldestMessage Amazon SQSメトリクスを監視することができます。
- NumberOfMessagesDeletedは、キューから削除されたメッセージの数を追跡します。これが0になった場合、関数レスポンスが失敗したメッセージを正しく返していないサインです。
- ApproximateAgeOfOldestMessage は、最も古いメッセージがどれくらいの時間キューに留まっているかを追跡します。この指標が急激に上昇した場合は、その関数が失敗したメッセージを正しく返せていないことを示しています。