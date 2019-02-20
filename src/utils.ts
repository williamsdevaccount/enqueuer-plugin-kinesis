import {Logger} from 'enqueuer-plugins-template';
import {Kinesis} from 'aws-sdk';

const createKinesisStream = async (client: Kinesis, StreamName: string): Promise<boolean> => {
  try {
      const output = await client.createStream({StreamName, ShardCount: 5}).promise();
      Logger.trace(`createStream output : ${JSON.stringify(output)}`);
      return true;
  } catch (e) {
      Logger.error(`error occured trying to create the kinesis stream: ${e}`);
      return false;
  }
};
export const getOrCreateStream = async (client: Kinesis, StreamName: string, createStream: boolean = false): Promise<boolean> => {
    let steamExists = false;
    try {
        const streamInfo: any = await client.describeStream({StreamName}).promise();
        steamExists = streamInfo!.StreamDescription!.StreamName! === StreamName;
    } catch (e) {
       Logger.error(`error occured trying to fetch stream information : ${e}`);
       steamExists = false;
    }
    if (!steamExists && createStream) {
        return await createKinesisStream(client, StreamName);
    }
    return steamExists;
};
