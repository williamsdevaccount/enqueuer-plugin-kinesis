import {PublisherProtocol, Publisher, PublisherModel, Logger, MainInstance} from 'enqueuer-plugins-template';
import {Kinesis} from 'aws-sdk';
import {getOrCreateStream} from './utils';

export class KinesisPublisher extends Publisher {
    public constructor(publish: PublisherModel) {
        super(publish);
        this.options = this.options || {};
        this.createStream = this.createStream || false;
    }

    public publish(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const client: Kinesis = new Kinesis(this.awsConfiguration);
            Logger.trace(`initialized kinesis client with endpoint: ${client.endpoint}`);
            const streamExists = await getOrCreateStream(client, this.streamName, this.createStream);
            Logger.trace(`kinesis stream ${this.streamName} exists: ${streamExists}`);
            if (!streamExists) {
                reject(new Error(`kinesis stream ${this.streamName} does not exist`));
            }
            const params = {
                Data: this.payload,
                PartitionKey: 'enqueuer',
                StreamName: this.streamName
            };
            try {
                Logger.trace(`posting to kinesis stream : ${this.streamName}, with args : ${JSON.stringify(params)}`);
                const result = await client.putRecord(params).promise();
                Logger.trace(`results from posting to kinesis stream : ${JSON.stringify(result)}`);
            } catch (e) {
                reject(`Error Publishing to kinesis stream : ${e}`);
            }
        });
    }
}

export function entryPoint(mainInstance: MainInstance): void {
    const kinesis = new PublisherProtocol('kinesis',
        (publisherModel: PublisherModel) => new KinesisPublisher(publisherModel))
        .setLibrary('kinesis');
    mainInstance.protocolManager.addProtocol(kinesis);
}