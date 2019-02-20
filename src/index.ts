import * as subscription from './kinesis-subscription';
import * as publisher from './kinesis-publisher';
import {MainInstance} from 'enqueuer-plugins-template';

export function entryPoint(mainInstance: MainInstance): void {
    subscription.entryPoint(mainInstance);
    publisher.entryPoint(mainInstance);
}
