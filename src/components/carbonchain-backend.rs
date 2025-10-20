// ============================================================================
// CarbonChain Backend - Substrate Runtime Pallets
// ============================================================================

// ============================================================================
// 1. Device Registry Pallet
// ============================================================================

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod device_registry {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency},
    };
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type Currency: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;
        
        #[pallet::constant]
        type RegistrationDeposit: Get<BalanceOf<Self>>;
        
        #[pallet::constant]
        type MaxMetadataLength: Get<u32>;
    }

    type BalanceOf<T> = <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum DeviceStatus {
        Pending,
        Active,
        Suspended,
        Revoked,
    }

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
    #[scale_info(skip_type_params(T))]
    pub struct Device<T: Config> {
        pub owner: T::AccountId,
        pub pubkey: Vec<u8>,
        pub manufacturer: Vec<u8>,
        pub metadata_uri: Vec<u8>,
        pub status: DeviceStatus,
        pub registered_at: T::BlockNumber,
        pub last_telemetry: T::BlockNumber,
    }

    #[pallet::storage]
    #[pallet::getter(fn devices)]
    pub type Devices<T: Config> = StorageMap<_, Blake2_128Concat, Vec<u8>, Device<T>>;

    #[pallet::storage]
    #[pallet::getter(fn device_owner)]
    pub type DevicesByOwner<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<Vec<u8>, ConstU32<100>>,
        ValueQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn whitelisted_manufacturers)]
    pub type WhitelistedManufacturers<T: Config> = StorageMap<_, Blake2_128Concat, Vec<u8>, bool, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        DeviceRegistered { device_id: Vec<u8>, owner: T::AccountId },
        DeviceStatusChanged { device_id: Vec<u8>, status: DeviceStatus },
        DeviceRevoked { device_id: Vec<u8> },
        ManufacturerWhitelisted { manufacturer: Vec<u8> },
        MetadataUpdated { device_id: Vec<u8> },
    }

    #[pallet::error]
    pub enum Error<T> {
        DeviceAlreadyExists,
        DeviceNotFound,
        NotDeviceOwner,
        ManufacturerNotWhitelisted,
        MetadataTooLong,
        InvalidPublicKey,
        InsufficientBalance,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000)]
        pub fn register_device(
            origin: OriginFor<T>,
            device_id: Vec<u8>,
            pubkey: Vec<u8>,
            manufacturer: Vec<u8>,
            metadata_uri: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            ensure!(!Devices::<T>::contains_key(&device_id), Error::<T>::DeviceAlreadyExists);
            ensure!(
                WhitelistedManufacturers::<T>::get(&manufacturer),
                Error::<T>::ManufacturerNotWhitelisted
            );
            ensure!(
                metadata_uri.len() <= T::MaxMetadataLength::get() as usize,
                Error::<T>::MetadataTooLong
            );
            ensure!(pubkey.len() == 32, Error::<T>::InvalidPublicKey);

            // Reserve deposit
            T::Currency::reserve(&who, T::RegistrationDeposit::get())
                .map_err(|_| Error::<T>::InsufficientBalance)?;

            let device = Device {
                owner: who.clone(),
                pubkey,
                manufacturer,
                metadata_uri,
                status: DeviceStatus::Pending,
                registered_at: <frame_system::Pallet<T>>::block_number(),
                last_telemetry: <frame_system::Pallet<T>>::block_number(),
            };

            Devices::<T>::insert(&device_id, device);
            
            DevicesByOwner::<T>::try_mutate(&who, |devices| {
                devices.try_push(device_id.clone())
            }).map_err(|_| Error::<T>::DeviceAlreadyExists)?;

            Self::deposit_event(Event::DeviceRegistered { device_id, owner: who });
            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn update_device_status(
            origin: OriginFor<T>,
            device_id: Vec<u8>,
            status: DeviceStatus,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            Devices::<T>::try_mutate(&device_id, |device_opt| -> DispatchResult {
                let device = device_opt.as_mut().ok_or(Error::<T>::DeviceNotFound)?;
                ensure!(device.owner == who, Error::<T>::NotDeviceOwner);
                device.status = status.clone();
                Ok(())
            })?;

            Self::deposit_event(Event::DeviceStatusChanged { device_id, status });
            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn revoke_device(origin: OriginFor<T>, device_id: Vec<u8>) -> DispatchResult {
            let who = ensure_signed(origin)?;

            let device = Devices::<T>::get(&device_id).ok_or(Error::<T>::DeviceNotFound)?;
            ensure!(device.owner == who, Error::<T>::NotDeviceOwner);

            Devices::<T>::remove(&device_id);
            T::Currency::unreserve(&who, T::RegistrationDeposit::get());

            Self::deposit_event(Event::DeviceRevoked { device_id });
            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn whitelist_manufacturer(origin: OriginFor<T>, manufacturer: Vec<u8>) -> DispatchResult {
            ensure_root(origin)?;
            WhitelistedManufacturers::<T>::insert(&manufacturer, true);
            Self::deposit_event(Event::ManufacturerWhitelisted { manufacturer });
            Ok(())
        }
    }
}

// ============================================================================
// 2. Oracle Pallet (Telemetry Verification)
// ============================================================================

#[frame_support::pallet]
pub mod oracle {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;
    use sp_runtime::traits::Hash;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config + device_registry::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        #[pallet::constant]
        type MinOracleNodes: Get<u32>;
        
        #[pallet::constant]
        type TelemetryTimeout: Get<T::BlockNumber>;
    }

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
    pub struct TelemetryReport<AccountId, BlockNumber> {
        pub device_id: Vec<u8>,
        pub timestamp: u64,
        pub co2_captured: u64, // in grams
        pub energy_produced: u64, // in watt-hours
        pub data_hash: [u8; 32],
        pub oracle_signatures: Vec<(AccountId, Vec<u8>)>,
        pub submitted_at: BlockNumber,
    }

    #[pallet::storage]
    #[pallet::getter(fn oracle_nodes)]
    pub type OracleNodes<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, bool, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn telemetry_reports)]
    pub type TelemetryReports<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        Vec<u8>,
        Vec<TelemetryReport<T::AccountId, T::BlockNumber>>,
        ValueQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn nonces)]
    pub type Nonces<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        Vec<u8>, // device_id
        Blake2_128Concat,
        u64, // nonce
        bool,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        TelemetryVerified {
            device_id: Vec<u8>,
            co2_captured: u64,
            energy_produced: u64,
            data_hash: [u8; 32],
        },
        OracleNodeAdded { oracle: T::AccountId },
        OracleNodeRemoved { oracle: T::AccountId },
        TelemetryRejected { device_id: Vec<u8>, reason: Vec<u8> },
    }

    #[pallet::error]
    pub enum Error<T> {
        DeviceNotFound,
        DeviceNotActive,
        InsufficientOracleSignatures,
        InvalidSignature,
        NonceAlreadyUsed,
        TelemetryTimeout,
        NotOracleNode,
        InvalidDataHash,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(50_000)]
        pub fn submit_telemetry(
            origin: OriginFor<T>,
            device_id: Vec<u8>,
            timestamp: u64,
            co2_captured: u64,
            energy_produced: u64,
            data_hash: [u8; 32],
            nonce: u64,
            oracle_signatures: Vec<(T::AccountId, Vec<u8>)>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Verify oracle node
            ensure!(OracleNodes::<T>::get(&who), Error::<T>::NotOracleNode);

            // Verify device exists and is active
            let device = device_registry::Devices::<T>::get(&device_id)
                .ok_or(Error::<T>::DeviceNotFound)?;
            ensure!(
                device.status == device_registry::DeviceStatus::Active,
                Error::<T>::DeviceNotActive
            );

            // Check nonce (replay protection)
            ensure!(!Nonces::<T>::get(&device_id, nonce), Error::<T>::NonceAlreadyUsed);

            // Verify minimum oracle signatures
            ensure!(
                oracle_signatures.len() >= T::MinOracleNodes::get() as usize,
                Error::<T>::InsufficientOracleSignatures
            );

            // TODO: Verify each signature against data_hash
            // In production, implement proper signature verification

            let report = TelemetryReport {
                device_id: device_id.clone(),
                timestamp,
                co2_captured,
                energy_produced,
                data_hash,
                oracle_signatures,
                submitted_at: <frame_system::Pallet<T>>::block_number(),
            };

            // Store report
            TelemetryReports::<T>::append(&device_id, report);
            
            // Mark nonce as used
            Nonces::<T>::insert(&device_id, nonce, true);

            // Update device last telemetry
            device_registry::Devices::<T>::mutate(&device_id, |device_opt| {
                if let Some(device) = device_opt {
                    device.last_telemetry = <frame_system::Pallet<T>>::block_number();
                }
            });

            Self::deposit_event(Event::TelemetryVerified {
                device_id,
                co2_captured,
                energy_produced,
                data_hash,
            });

            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn add_oracle_node(origin: OriginFor<T>, oracle: T::AccountId) -> DispatchResult {
            ensure_root(origin)?;
            OracleNodes::<T>::insert(&oracle, true);
            Self::deposit_event(Event::OracleNodeAdded { oracle });
            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn remove_oracle_node(origin: OriginFor<T>, oracle: T::AccountId) -> DispatchResult {
            ensure_root(origin)?;
            OracleNodes::<T>::remove(&oracle);
            Self::deposit_event(Event::OracleNodeRemoved { oracle });
            Ok(())
        }
    }
}

// ============================================================================
// 3. CET Token Pallet (Carbon Energy Token)
// ============================================================================

#[frame_support::pallet]
pub mod cet_token {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ExistenceRequirement},
    };
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config + oracle::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        #[pallet::constant]
        type MintRatePerKwh: Get<u128>; // CET tokens per kWh
    }

    #[pallet::storage]
    #[pallet::getter(fn total_supply)]
    pub type TotalSupply<T: Config> = StorageValue<_, u128, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn balances)]
    pub type Balances<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u128, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn pending_rewards)]
    pub type PendingRewards<T: Config> = StorageMap<_, Blake2_128Concat, T::AccountId, u128, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn allowances)]
    pub type Allowances<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        Blake2_128Concat,
        T::AccountId,
        u128,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        TokensMinted { to: T::AccountId, amount: u128 },
        TokensBurned { from: T::AccountId, amount: u128 },
        Transfer { from: T::AccountId, to: T::AccountId, amount: u128 },
        RewardsClaimed { account: T::AccountId, amount: u128 },
        Approval { owner: T::AccountId, spender: T::AccountId, amount: u128 },
    }

    #[pallet::error]
    pub enum Error<T> {
        InsufficientBalance,
        InsufficientAllowance,
        Overflow,
        NotAuthorized,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        fn on_finalize(_n: T::BlockNumber) {
            // Calculate and distribute rewards based on verified telemetry
            // This runs at the end of each block
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000)]
        pub fn mint(
            origin: OriginFor<T>,
            to: T::AccountId,
            amount: u128,
        ) -> DispatchResult {
            // Only oracle pallet can mint
            ensure_root(origin)?;

            Balances::<T>::try_mutate(&to, |balance| -> DispatchResult {
                *balance = balance.checked_add(amount).ok_or(Error::<T>::Overflow)?;
                Ok(())
            })?;

            TotalSupply::<T>::try_mutate(|supply| -> DispatchResult {
                *supply = supply.checked_add(amount).ok_or(Error::<T>::Overflow)?;
                Ok(())
            })?;

            Self::deposit_event(Event::TokensMinted { to, amount });
            Ok(())
        }

        #[pallet::weight(10_000)]
        pub fn transfer(
            origin: OriginFor<T>,
            to: T::AccountId,
            amount: u128,
        ) -> DispatchResult {
            let from = ensure_signed(origin)?;

            Balances::<T>::try_mutate(&from, |balance| -> DispatchResult {
                *balance = balance.checked_sub(amount).ok_or(Error::<T>::InsufficientBalance)?;
                Ok(())
            })?;

            Balances::<T>::try_mutate(&to, |balance| -> DispatchResult {
                *balance = balance.checked_add(amount).ok_or(Error::<T>::Overflow)?;
                Ok(())
            })?;

            Self::deposit_event(Event::Transfer { from, to, amount });
            Ok(())
        }

        #[pallet::weight(10_000)]
        pub fn burn(origin: OriginFor<T>, amount: u128) -> DispatchResult {
            let from = ensure_signed(origin)?;

            Balances::<T>::try_mutate(&from, |balance| -> DispatchResult {
                *balance = balance.checked_sub(amount).ok_or(Error::<T>::InsufficientBalance)?;
                Ok(())
            })?;

            TotalSupply::<T>::try_mutate(|supply| -> DispatchResult {
                *supply = supply.checked_sub(amount).ok_or(Error::<T>::InsufficientBalance)?;
                Ok(())
            })?;

            Self::deposit_event(Event::TokensBurned { from, amount });
            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn claim_rewards(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;

            let rewards = PendingRewards::<T>::take(&who);
            ensure!(rewards > 0, Error::<T>::InsufficientBalance);

            Balances::<T>::try_mutate(&who, |balance| -> DispatchResult {
                *balance = balance.checked_add(rewards).ok_or(Error::<T>::Overflow)?;
                Ok(())
            })?;

            Self::deposit_event(Event::RewardsClaimed { account: who, amount: rewards });
            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn approve(
            origin: OriginFor<T>,
            spender: T::AccountId,
            amount: u128,
        ) -> DispatchResult {
            let owner = ensure_signed(origin)?;
            Allowances::<T>::insert(&owner, &spender, amount);
            Self::deposit_event(Event::Approval { owner, spender, amount });
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        pub fn calculate_reward(energy_wh: u64) -> u128 {
            let kwh = energy_wh / 1000;
            (kwh as u128) * T::MintRatePerKwh::get()
        }

        pub fn add_pending_reward(account: &T::AccountId, amount: u128) {
            PendingRewards::<T>::mutate(account, |balance| {
                *balance = balance.saturating_add(amount);
            });
        }
    }
}

// ============================================================================
// 4. DAO Governance Pallet
// ============================================================================

#[frame_support::pallet]
pub mod dao_governance {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config + cet_token::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        #[pallet::constant]
        type VotingPeriod: Get<T::BlockNumber>;
        
        #[pallet::constant]
        type MinProposalDeposit: Get<u128>;
    }

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
    pub enum ProposalStatus {
        Active,
        Passed,
        Rejected,
        Executed,
    }

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
    #[scale_info(skip_type_params(T))]
    pub struct Proposal<T: Config> {
        pub proposer: T::AccountId,
        pub title: Vec<u8>,
        pub description: Vec<u8>,
        pub votes_for: u128,
        pub votes_against: u128,
        pub status: ProposalStatus,
        pub created_at: T::BlockNumber,
        pub voting_ends: T::BlockNumber,
    }

    #[pallet::storage]
    #[pallet::getter(fn proposals)]
    pub type Proposals<T: Config> = StorageMap<_, Blake2_128Concat, u32, Proposal<T>>;

    #[pallet::storage]
    #[pallet::getter(fn proposal_count)]
    pub type ProposalCount<T: Config> = StorageValue<_, u32, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn votes)]
    pub type Votes<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        u32, // proposal_id
        Blake2_128Concat,
        T::AccountId,
        (bool, u128), // (support, weight)
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        ProposalCreated { proposal_id: u32, proposer: T::AccountId },
        VoteCast { proposal_id: u32, voter: T::AccountId, support: bool, weight: u128 },
        ProposalExecuted { proposal_id: u32 },
        ProposalRejected { proposal_id: u32 },
    }

    #[pallet::error]
    pub enum Error<T> {
        ProposalNotFound,
        VotingEnded,
        AlreadyVoted,
        InsufficientBalance,
        ProposalNotPassed,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000)]
        pub fn create_proposal(
            origin: OriginFor<T>,
            title: Vec<u8>,
            description: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            let balance = cet_token::Balances::<T>::get(&who);
            ensure!(balance >= T::MinProposalDeposit::get(), Error::<T>::InsufficientBalance);

            let proposal_id = ProposalCount::<T>::get();
            let current_block = <frame_system::Pallet<T>>::block_number();

            let proposal = Proposal {
                proposer: who.clone(),
                title,
                description,
                votes_for: 0,
                votes_against: 0,
                status: ProposalStatus::Active,
                created_at: current_block,
                voting_ends: current_block + T::VotingPeriod::get(),
            };

            Proposals::<T>::insert(proposal_id, proposal);
            ProposalCount::<T>::put(proposal_id + 1);

            Self::deposit_event(Event::ProposalCreated { proposal_id, proposer: who });
            Ok(())
        }

        #[pallet::weight(10_000)]
        pub fn vote(
            origin: OriginFor<T>,
            proposal_id: u32,
            support: bool,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            let mut proposal = Proposals::<T>::get(proposal_id)
                .ok_or(Error::<T>::ProposalNotFound)?;

            let current_block = <frame_system::Pallet<T>>::block_number();
            ensure!(current_block < proposal.voting_ends, Error::<T>::VotingEnded);

            let (already_voted, _) = Votes::<T>::get(proposal_id, &who);
            ensure!(!already_voted, Error::<T>::AlreadyVoted);

            let voting_weight = cet_token::Balances::<T>::get(&who);

            if support {
                proposal.votes_for = proposal.votes_for.saturating_add(voting_weight);
            } else {
                proposal.votes_against = proposal.votes_against.saturating_add(voting_weight);
            }

            Proposals::<T>::insert(proposal_id, proposal);
            Votes::<T>::insert(proposal_id, &who, (true, voting_weight));

            Self::deposit_event(Event::VoteCast {
                proposal_id,
                voter: who,
                support,
                weight: voting_weight,
            });

            Ok(())
        }

        #[pallet::weight(10_000)]
        pub fn execute_proposal(origin: OriginFor<T>, proposal_id: u32) -> DispatchResult {
            ensure_signed(origin)?;

            let mut proposal = Proposals::<T>::get(proposal_id)
                .ok_or(Error::<T>::ProposalNotFound)?;

            let current_block = <frame_system::Pallet<T>>::block_number();
            ensure!(current_block >= proposal.voting_ends, Error::<T>::VotingEnded);

            if proposal.votes_for > proposal.votes_against {
                proposal.status = ProposalStatus::Executed;
                Proposals::<T>::insert(proposal_id, proposal);
                Self::deposit_event(Event::ProposalExecuted { proposal_id });
            } else {
                proposal.status = ProposalStatus::Rejected;
                Proposals::<T>::insert(proposal_id, proposal);
                Self::deposit_event(Event::ProposalRejected { proposal_id });
            }

            Ok(())
        }
    }
}
