import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { UserProfile } from './user-profile.entity';
  
  @Entity()
  export class User {
    constructor(partial?: Partial<User>) {
      Object.assign(this, partial);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({
      type: 'varchar',
      unique: true,
      nullable: true,
    })
    email: string;
  
    @Column({ nullable: true })
    password: string;
  
    @Column({ nullable: true })
    externalToken: string;
  
    @Column({ nullable: true })
    lastActivityDate?: Date;
  
    @Column({ nullable: true })
    lastTicketSynchronisationTime?: Date;
  
    @Column({ nullable: true })
    lastUsersSynchronisationTime?: Date;
  
    @Column({ nullable: true })
    lastDeviceSynchronisationTime?: Date;
  
    @Column({ nullable: true })
    lastRequestTime?: Date;
  
    @Column({ nullable: true })
    timeGeneratedExternalToken?: Date;
  
    @OneToOne(() => UserProfile)
    @JoinColumn()
    profile: UserProfile;
  
    @Column({ length: 2, nullable: true })
    niveau?: string;
  }
  