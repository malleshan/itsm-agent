import { Module } from '@nestjs/common';
import { GithubAdapter } from './github.adapter';
import { SlackAdapter } from './slack.adapter';
import { GoogleAdapter } from './google.adapter';

/**
 * AdaptersModule
 *
 * Registers all third-party integration adapters as NestJS providers so they
 * can be injected anywhere in the application via dependency injection.
 *
 * Add new adapters (Jira, Zoom, ServiceNow, etc.) here.
 */
@Module({
  providers: [GithubAdapter, SlackAdapter, GoogleAdapter],
  exports: [GithubAdapter, SlackAdapter, GoogleAdapter],
})
export class AdaptersModule {}
