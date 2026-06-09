import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CaslService } from '../casl.service';
import {
  CASL_ACTIONS_KEY,
  CASL_FIELDS_KEY,
  CaslActionMetadata,
} from '../decorators/casl.decorator';
import { ERROR_MESSAGES } from '../../common/messages';
import { EntityNameCasl } from 'src/shared/universal/types';

@Injectable()
export class CaslInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private caslService: CaslService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Verificar ações CASL
    const actions = this.reflector.getAllAndOverride<CaslActionMetadata | CaslActionMetadata[]>(
      CASL_ACTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (actions) {
      this.validateActions(actions, request);
    }

    // Verificar campos específicos
    const fields = this.reflector.getAllAndOverride<{ subject: string; fields: string[] }>(
      CASL_FIELDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (fields) {
      this.validateFields(fields, request);
    }
    return next.handle();
  }

  private validateActions(
    actions: CaslActionMetadata | CaslActionMetadata[],
    request: any,
  ): void {
    const actionsArray = Array.isArray(actions) ? actions : [actions];

    for (const action of actionsArray) {
      try {
        // Validação básica de ação
        this.caslService.validarAction(action.action, action.subject as EntityNameCasl);

        // Se há campos específicos, validar também
        if (action.fields && action.fields.length > 0) {
          const body = request.body || {};
          const fieldsToValidate = action.fields.filter(field => 
            body.hasOwnProperty(field)
          );
          
          if (fieldsToValidate.length > 0) {
            const updateData = fieldsToValidate.reduce((acc, field) => {
              acc[field] = body[field];
              return acc;
            }, {} as any);
            
            this.caslService.validarPermissaoDeCampo(action.subject as EntityNameCasl, updateData);
          }
        }
      } catch (error) {
        throw new ForbiddenException(
          ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
        );
      }
    }
  }

  private validateFields(
    fields: { subject: string; fields: string[] },
    request: any,
  ): void {
    const body = request.body || {};
    const fieldsToValidate = fields.fields.filter(field => 
      body.hasOwnProperty(field)
    );

    if (fieldsToValidate.length > 0) {
      const updateData = fieldsToValidate.reduce((acc, field) => {
        acc[field] = body[field];
        return acc;
      }, {} as any);

      try {
        this.caslService.validarPermissaoDeCampo(fields.subject as EntityNameCasl, updateData);
      } catch (error) {
        throw new ForbiddenException(
          ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
        );
      }
    }
  }
} 