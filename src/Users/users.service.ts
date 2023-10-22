import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import {
    catchError,
    lastValueFrom,
    Observable,
    tap,
    timeout,
    TimeoutError,
} from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as https from 'https';
import { UserType } from './userType';
import { ChangeRoleDto } from './changeRoleDto';
import { Like, Repository } from 'typeorm';
import { User } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Niveau } from './niveau.entity';
import {
    UE_SYNCHRO,
    TIMEOUT_DURATION,
    USER_SYNCHRO,
  } from '../utils/constant';
import { UserProfile } from './user-profile.entity';
import { UserFromJwtDto } from 'src/utils/userFromJwtDto';

// This should be a real class/interface representing a user entity
//export type User = any

@Injectable()
export class UserService { 
    private readonly logger = new Logger(UserService.name);
    @InjectRepository(User)
    private readonly userRepository: Repository<User>;

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>;

    @InjectRepository(Niveau)
    private readonly niveauRepository: Repository<Niveau>;
    constructor(private readonly httpService: HttpService) {
        const agent = new https.Agent({
        rejectUnauthorized: false,
        });
        this.httpService.axiosRef.defaults.httpsAgent = agent;
    }

    async resetPassword(password, user: UserFromJwtDto) {
        //TODO Erreur si bali est off
        //TODO resetPassword n'est pas une activité
        //recuperer l'utilisateur connecté
        const userResult: User = await this.userRepository.findOne({
            where: { id: user.sub },
            relations: ['profile'],
        });

        //mettre a jour la date de derniere activite
        this.userRepository.save({
            id: userResult.id,
            email: userResult.email,
            lastActivityDate: new Date(),
        });
        
        if (userResult.externalToken == null) {
            throw new HttpException(
              'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
              HttpStatus.REQUEST_TIMEOUT,
            );
        }
        const headersRequest = {
           'Content-Type': 'application/x-www-form-urlencoded',
           Authorization: 'Bearer ' + userResult.externalToken,
        };
      
        const requestData = new URLSearchParams();
        requestData.append('password', password);
        
        const responseObservable: Observable<any> = await this.httpService
            .post(
                'https://balipreprod.arescom.fr/bali/api/user/reset-password',
                requestData.toString(),
                {
                headers: headersRequest,
                },
            )
            .pipe(
                timeout(TIMEOUT_DURATION),
                catchError(async (error: any) => {
                if (error instanceof TimeoutError) {
                    throw new HttpException(
                    'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
                    HttpStatus.REQUEST_TIMEOUT,
                    );
                } else if (error instanceof UnauthorizedException) {
                    throw new UnauthorizedException();
                }
                }),
            );
        const { data: data, status: status } = await lastValueFrom(
                responseObservable,
        );

        if (status == 200 || status == 201) {
                await this.userRepository.save({
                        id: userResult.id,
                        password: password,
                });
        }

        return data;
    }
    
    async getUserConnected(userFromJwt: UserFromJwtDto) {
        //recuperer l'utilisateur connecté
        const userResult: User = await this.userRepository.findOne({
          where: { id: userFromJwt.sub },
          relations: ['profile', 'profile.niveau'],
        });
    
        //mettre à jour la date de dernière activité
        this.userRepository.save({
          id: userResult.id,
          email: userResult.email,
          lastActivityDate: new Date(),
        });
        //TODO : pas d'appel bali dans cette fonction
        return userResult;
    }
    
    async getUserCount(userFromJwt: UserFromJwtDto) {
        //recuperer l'utilisateur connecté
        const userResult: User = await this.userRepository.findOne({
          where: { id: userFromJwt.sub },
          relations: ['profile', 'profile.niveau'],
        });
    
        //mettre à jour la date de dernière activité
        this.userRepository.save({
          id: userResult.id,
          email: userResult.email,
          lastActivityDate: new Date(),
        });
    
        const userNumber = await this.userProfileRepository.count({
          where: { niveau: userResult.profile.niveau },
        });
    
        return { result: userNumber };
    }
    
    async updateUser(userFromJwt: UserFromJwtDto, userObject: UserType) {
        const requestData = new URLSearchParams();
        if (userObject.filiere) {
          requestData.append('niveauPersonForm[filiere]', userObject.filiere);
        }
        if (userObject.phone) {
          requestData.append('niveauPersonForm[phone]', userObject.phone);
        }
    
        if (userObject.first_name) {
          requestData.append(
            'niveauPersonForm[first_name]',
            userObject.first_name,
          );
        }
    
        if (userObject.name) {
          requestData.append('niveauPersonForm[name]', userObject.name);
        }
    
        if (userObject.gender) {
          requestData.append('niveauPersonForm[gender]', userObject.gender);
        }
    
        if (userObject.last_name) {
          requestData.append('niveauPersonForm[last_name]', userObject.last_name);
        }
    
        //recuperer l'utilisateur connecté
        const userResult: User = await this.userRepository.findOne({
          where: { id: userFromJwt.sub },
          relations: ['profile'],
        });
    
        //mettre à jour la date de dernière activité
        this.userRepository.save({
          id: userResult.id,
          email: userResult.email,
          lastActivityDate: new Date(),
        });
    
        if (userResult.externalToken == null) {
          throw new HttpException(
            'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
            HttpStatus.REQUEST_TIMEOUT,
          );
        }
    
        const responseObservableGetConnectedUser: Observable<any> =
          await this.httpService
            .post(
              'https://balipreprod.arescom.fr/bali/api/user/update',
              requestData.toString(),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization: 'Bearer ' + userResult.externalToken,
                },
              },
            )
            .pipe(
              timeout(TIMEOUT_DURATION),
              catchError(async (error: any) => {
                if (error instanceof TimeoutError) {
                  throw new HttpException(
                    'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
                    HttpStatus.REQUEST_TIMEOUT,
                  );
                } else if (error instanceof UnauthorizedException) {
                  throw new UnauthorizedException();
                }
              }),
            );
    
        const { data: responseFromApi, status: status } = await lastValueFrom(
          responseObservableGetConnectedUser,
        );
    
        //TODO save to extranet
        if (status == 200 || status == 201) {
          await this.userProfileRepository.save({
            id: userResult.profile.id,
            filiere: userObject.filiere ?? userResult.profile.filiere,
            phone: userObject.phone ?? userResult.profile.phone,
          });
        }
    
        const response: any = responseFromApi;
        return response;
    }

    async getAllUser(
        userFromJwt: UserFromJwtDto,
        groupeId?: string,
        search?: string,
        orderBy?: string,
        order?: 'DESC' | 'ASC',
    ) {
        if (!order || !orderBy) {
            orderBy = 'userProfile.firstname';
            order = 'ASC';
        }
        const orderByFilter = [
            'userProfile.firstname',
            'userProfile.fromDate',
            'user.lastActivityDate',
            'user.groupe',
        ];
        if (!orderByFilter.includes(orderBy)) {
            throw new NotFoundException(
              `le parametre ${orderBy} n'existe pas dans la base`,
            );
        }
        const requestData = new URLSearchParams();
        if (groupeId) {
          requestData.append('UserSearch[group_id]', groupeId);
        }
        if (search) {
          requestData.append('UserSearch[search]', search);
        }
         //recuperer l'utilisateur connecté
        const userResult: User = await this.userRepository.findOne({
            where: { id: userFromJwt.sub },
            relations: ['profile', 'profile.niveau'],
        });
    
        if (userResult.groupe != 'AD') {
            throw new UnauthorizedException('Accès refusé');
        }
    
        //mettre à jour la date de dernière activité
        this.userRepository.save({
            id: userResult.id,
            email: userResult.email,
            lastActivityDate: new Date(),
        });
        const dateSynchro = new Date(userResult.lastUsersSynchronisationTime);
        const currentDate = new Date();
    
        const differenceInMilliseconds =
          currentDate.getTime() - dateSynchro.getTime();

        if (
            differenceInMilliseconds > USER_SYNCHRO &&
            userResult.externalToken != null
        ) {
            const responseObservableGetConnectedUser = await this.httpService
              .post(
                'https://balipreprod.arescom.fr/bali/api/user',
                requestData.toString(),
                {
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Bearer ' + userResult.externalToken,
                  },
                },
              )
              .pipe(
                catchError((error: AxiosError) => {
                  throw new HttpException(
                    error.response?.data,
                    HttpStatus.UNAUTHORIZED,
                    {
                      cause: error,
                    },
                  );
                }),
              );
            const { data: responseFromApi } = await lastValueFrom(
              responseObservableGetConnectedUser,
            );
      
            if (responseFromApi.result.length > 0) {
              for (const user of responseFromApi.result) {
                const userFromList = await this.userRepository.findOne({
                  where: { id: user['person.id'] },
                });
                if (!userFromList) {
                  const userProfileToSave = await this.userProfileRepository.save({
                    id: user['person.id'],
                    niveau_person_id: user.niveau_person_id,
                    firstname: user['person.first_name'],
                    lastname: user['person.last_name'],
                    fromDate: new Date(user['niveauPerson.from_date']),
                    toDate: user['niveauPerson.to_date']
                      ? new Date(user['niveauPerson.to_date'])
                      : null,
                    niveau: userResult.profile.niveau,
                  });
                }
              }
            }
      
            //mettre à jour la date de dernière activité
            this.userRepository.save({
              id: userResult.id,
              email: userResult.email,
              lastUsersSynchronisationTime: new Date(),
            });
      
            const response: any = responseFromApi;
            return response;
        } else {
            if (groupeId && !search) {
              const usersCount = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .andWhere('user.group = :groupeId', {
                  groupeId: groupeId,
                })
                .getCount();
      
              const users = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .andWhere('user.group = :groupeId', {
                  groupeId: groupeId,
                })
                .orderBy(orderBy, order)
                .getMany();
              return {
                totalCount: usersCount,
                result: users,
              };
            }
      
            if (!groupeId && search) {
              const usersCount = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .andWhere([
                  { firstname: Like(`%${search}%`) },
                  { lastname: Like(`%${search}%`) },
                ])
                .getCount();
              const users = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .andWhere([
                  { firstname: Like(`%${search}%`) },
                  { lastname: Like(`%${search}%`) },
                ])
                .orderBy(orderBy, order)
                .getMany();
              return {
                totalCount: usersCount,
                result: users,
              };
            }
      
            if (groupeId && search) {
              const usersCount = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .andWhere([
                  { firstname: Like(`%${search}%`) },
                  { lastname: Like(`%${search}%`) },
                ])
                .andWhere('user.group = :groupeId', {
                  groupeId: groupeId,
                })
                .orderBy(orderBy, order)
                .getCount();
              const users = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .andWhere([
                  { firstname: Like(`%${search}%`) },
                  { lastname: Like(`%${search}%`) },
                ])
                .andWhere('user.group = :groupeId', {
                  groupeId: groupeId,
                })
                .orderBy(orderBy, order)
                .getMany();
              return {
                totalCount: usersCount,
                result: users,
              };
            }
      
            if (!search && !groupeId) {
              const usersCount = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .getCount();
              const users = await this.userProfileRepository
                .createQueryBuilder('userProfile')
                .leftJoinAndSelect('userProfile.ueentity', 'ueentity')
                .leftJoinAndSelect('userProfile.user', 'user')
                .where('userProfile.niveauId = :niveau', {
                  niveau: userResult.profile.niveau.id,
                })
                .orderBy(orderBy, order)
                .getMany();
              return {
                totalCount: usersCount,
                result: users,
              };
            }
        }
    } 

    async updateRole(
        userFromJwt: UserFromJwtDto,
        role: ChangeRoleDto,
        userId: number,
    ) {
        const requestData = new URLSearchParams();
        requestData.append('role_id', role.role_id);
        //recuperer l'utilisateur connecté
        const userResult: User = await this.userRepository.findOne({
            where: { id: userFromJwt.sub },
        });

        //mettre à jour la date de dernière activité
        this.userRepository.save({
            id: userResult.id,
            email: userResult.email,
            lastActivityDate: new Date(),
        });

        if (userResult.externalToken == null) {
            throw new HttpException(
                'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
                HttpStatus.REQUEST_TIMEOUT,
            );
        }
        
        const responseObservableGetConnectedUser: Observable<any> =
        await this.httpService
            .post(
            'https://balipreprod.arescom.fr/bali/api/user/update-role?id=' +
                userId,
            requestData.toString(),
            {
                headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Bearer ' + userResult.externalToken,
                },
            },
            )
            .pipe(
            timeout(TIMEOUT_DURATION),
            catchError(async (error: any) => {
                if (error instanceof TimeoutError) {
                throw new HttpException(
                    'Le service est actuellement indisponible pour raison de maintenance, veillez réessayer plus tard.',
                    HttpStatus.REQUEST_TIMEOUT,
                );
                } else if (error instanceof UnauthorizedException) {
                throw new UnauthorizedException();
                }
            }),
            );

        const { data: responseFromApi, status: status } = await lastValueFrom(
            responseObservableGetConnectedUser,
        );

        if (status == 200 || status == 201) {
            const userProfile: UserProfile = await this.userProfileRepository.findOne(
              {
                where: { id: userId },
                relations: ['user'],
              },
            );
            if (userProfile.user) {
              this.userRepository.save({
                id: userProfile.id,
                group: role.role_id,
              });
            }
        }
      
        const response: any = responseFromApi;
        return response;
    }
}