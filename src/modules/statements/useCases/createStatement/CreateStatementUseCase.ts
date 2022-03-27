import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

@injectable()
export class CreateStatementUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ user_id, type, amount, description, receiver_id }: ICreateStatementDTO) {
    const user = await this.usersRepository.findById(user_id);

    if (!user) {
      throw new CreateStatementError.UserNotFound();
    }

    if (receiver_id) {
      const receiver_user = await this.usersRepository.findById(receiver_id);
      if (!receiver_user) {
        throw new CreateStatementError.UserNotFound();
      }
    }

    if(type === 'transfer' && user_id == receiver_id) {
      throw new CreateStatementError.OperationNotPermitted();
    }

    let statementOperation;

    if (type === 'transfer') {
      const { balance } = await this.statementsRepository.getUserBalance({ user_id });

      if (balance < amount) {
        throw new CreateStatementError.InsufficientFunds()
      }

      //primeiro descontando o dinheiro do usuario principal
      await this.statementsRepository.create({
        user_id,
        type,
        amount,
        description,
        receiver_id,
      });

      //agora adicionando o valor ao usuario destino
      statementOperation = await this.statementsRepository.create({
        user_id: receiver_id as string,
        type,
        amount,
        description,
        sender_id: user_id,
      });
    } else {
      if(type === 'withdraw') {
        const { balance } = await this.statementsRepository.getUserBalance({ user_id });
  
        if (balance < amount) {
          throw new CreateStatementError.InsufficientFunds()
        }
      }
  
      statementOperation = await this.statementsRepository.create({
        user_id,
        type,
        amount,
        description,
      });
    }

    return statementOperation;
  }
}
