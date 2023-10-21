import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { User } from '../users/users.entity';
  import { Matiers } from './matiers.entity';
  import { UserProfile } from '../users/user-profile.entity';
  
export enum Status {
    'valide' = 'A',
    'non valide' = 'P',
  
  }

  export enum Category {
    'Licence 1' = 'L1',
    'Licence 2' = 'L2',
    'Licence 3' = 'L3',
    'Master 1' = 'M1',
    'Master 2' = 'M2'
  }
  
  @Entity({ name: 'UE' })
  export class UEEntity {
    constructor(partial?: Partial<UEEntity>) {
      Object.assign(this, partial);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  

    @Column()
    createdAt: Date;
  
    @Column({
      type: 'enum',
      enum: Category,
    })
    @Column({ nullable: true })
    lastSynchronisationTime: Date;
  
    @Column({
      type: 'enum',
      enum: Category,
    })
    category: Category;
  
    @Column({
        type: 'enum',
        enum: Status,
      })
    status: Status;
    
    @ManyToOne(() => UserProfile, (userProfile) => userProfile.ueentity)
    user: UserProfile;
  
    @OneToMany(() => Matiers, (matier) => matier.ueentity, {
      cascade: true,
    })
    matiers: Matiers[];
  }
  