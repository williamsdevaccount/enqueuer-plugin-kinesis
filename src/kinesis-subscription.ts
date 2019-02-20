import {Logger, MainInstance, Subscription, SubscriptionModel, SubscriptionProtocol} from 'enqueuer-plugins-template';
import {Kinesis} from 'aws-sdk';
import {getOrCreateStream} from './utils';

export class KinesisSubscription extends Subscription {
    private client?: Kinesis;
    private subscriber: any;
    private streamExists: boolean;
    private messageReceivedResolver?: (value?: (PromiseLike<any> | any)) => void;

    constructor(subscriptionAttributes: SubscriptionModel) {
        super(subscriptionAttributes);
        this.options = subscriptionAttributes.options || {};
        this.options.connectTimeout = this.options.connectTimeout || 10 * 1000;
        this.streamExists = false;
        this.createStream = this.createStream || false;
    }

    public receiveMessage(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.streamExists) {
                reject(`Error trying to receive message. Subscription is not connected yet: ${this.address}`);
            } else {
                Logger.debug('WS message receiver resolver initialized');
                this.messageReceivedResolver = resolve;
            }
        });
    }

    public subscribe(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this.awsConfiguration.params = {StreamName: this.streamName};
            this.client = new Kinesis(this.awsConfiguration);
            Logger.trace(`initialized kinesis client with endpoint: ${JSON.stringify(this.client.endpoint)}`);
            this.streamExists = await getOrCreateStream(this.client, this.streamName, this.createStream);
            if (!this.streamExists) {
                reject(new Error(`kinesis stream ${this.streamName} does not exist`));
            }
            this.subscriber = require('kinesis-readable')(this.client, {limit: 1});
            this.subscriber.on('data', (records: any[]) => this.onRecords(records));
            this.subscriber.on('error', (err: any) => {
               Logger.error(`error subscribing to stream: ${err}`);
               reject(err);
            });
            resolve();
        });
    }

    public async unsubscribe(): Promise<void> {
        this.streamExists = false;
        if (this.subscriber) {
            this.subscriber.close();
        }
        delete this.subscriber;
        delete this.client;
    }
    private onRecords(records: any[]) {
        records.forEach((record: any) => {
           Logger.trace(`record: ${JSON.stringify(record)}`);
        });
    }
    private gotMessage(payload: string) {
        Logger.debug('WS got message');
        if (this.messageReceivedResolver) {
            this.messageReceivedResolver({payload: payload});
        } else {
            Logger.error('WS message receiver resolver is not initialized');
        }
    }
}

export function entryPoint(mainInstance: MainInstance): void {
    const kinesis = new SubscriptionProtocol('kinesis',
        (subscriptionModel: SubscriptionModel) => new KinesisSubscription(subscriptionModel),
        ['payload'])
        .setLibrary('kinesis');
    mainInstance.protocolManager.addProtocol(kinesis);
}