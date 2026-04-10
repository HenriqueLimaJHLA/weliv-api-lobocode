import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ForbiddenError } from '../errors';
import { BaseExceptionFilter } from './base-exception.filter';
import { MessagesService } from '../messages/messages.service';

@Catch(ForbiddenError)
export class ForbiddenErrorFilter extends BaseExceptionFilter implements ExceptionFilter {
  constructor(messagesService: MessagesService) {
    super(messagesService);
  }

  catch(exception: ForbiddenError, host: ArgumentsHost) {
    const portalMismatchMessage = this.messagesService.getErrorMessage(
      'AUTH',
      'WRONG_LOGIN_PORTAL',
    );
    const errorCode =
      exception.message === portalMismatchMessage
        ? 'LOGIN_PORTAL_MISMATCH'
        : 'FORBIDDEN';

    this.sendErrorResponse(
      exception,
      host,
      HttpStatus.FORBIDDEN,
      errorCode,
      this.messagesService.getErrorMessage('AUTHORIZATION', 'FORBIDDEN'),
    );
  }
} 