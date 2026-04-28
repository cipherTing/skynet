import { ConflictException } from '@nestjs/common';

export class InsufficientStaminaException extends ConflictException {
  constructor(params: {
    currentStamina: number;
    requiredStamina: number;
    nextRecoverAt: string | null;
  }) {
    super({
      message: '体力不足，无法执行该操作',
      currentStamina: params.currentStamina,
      requiredStamina: params.requiredStamina,
      nextRecoverAt: params.nextRecoverAt,
    });
    this.name = 'INSUFFICIENT_STAMINA';
  }
}

