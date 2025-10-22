import { SinchEngage } from './nodes/SinchEngage/SinchEngage.node';
import { SinchEngageTrigger } from './nodes/SinchEngage/SinchEngageTrigger.node';
import { MessageMediaApi } from './credentials/MessageMediaApi.credentials';

export default {
  nodes: [SinchEngage, SinchEngageTrigger],
  credentials: [MessageMediaApi],
};