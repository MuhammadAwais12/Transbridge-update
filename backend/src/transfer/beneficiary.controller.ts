import { providers } from '../config/providers.config';
import { Controller, Post, Body, BadRequestException, Get, Param, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary } from '../client/beneficiary.entity';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@Authenticated()
@Controller('beneficiary')
export class BeneficiaryController {
  constructor(
    @InjectRepository(Beneficiary)
    private readonly beneficiaryRepository: Repository<Beneficiary>,
    private readonly access: AccessService,
  ) {}

  // Helper function to convert country names to ISO codes
  private getCountryCode(countryName: string): string {
    const countryMap: { [key: string]: string } = {
      'United States': 'US',
      'Canada': 'CA',
      'United Kingdom': 'GB',
      'Australia': 'AU',
      'Germany': 'DE',
      'France': 'FR',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Mexico': 'MX',
      'Italy': 'IT',
      'Spain': 'ES',
      'Netherlands': 'NL',
      'Switzerland': 'CH',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Belgium': 'BE',
      'Austria': 'AT',
      'Poland': 'PL',
      'Czech Republic': 'CZ',
      'Hungary': 'HU',
      'Slovakia': 'SK',
      'Slovenia': 'SI',
      'Croatia': 'HR',
      'Romania': 'RO',
      'Bulgaria': 'BG',
      'Greece': 'GR',
      'Portugal': 'PT',
      'Ireland': 'IE',
      'Luxembourg': 'LU',
      'Estonia': 'EE',
      'Latvia': 'LV',
      'Lithuania': 'LT',
      'Malta': 'MT',
      'Cyprus': 'CY',
      'Iceland': 'IS',
      'Liechtenstein': 'LI',
      'Monaco': 'MC',
      'San Marino': 'SM',
      'Vatican City': 'VA',
      'Andorra': 'AD',
      'Albania': 'AL',
      'Armenia': 'AM',
      'Azerbaijan': 'AZ',
      'Belarus': 'BY',
      'Bosnia and Herzegovina': 'BA',
      'Georgia': 'GE',
      'Kazakhstan': 'KZ',
      'Kyrgyzstan': 'KG',
      'Moldova': 'MD',
      'Montenegro': 'ME',
      'North Macedonia': 'MK',
      'Russia': 'RU',
      'Serbia': 'RS',
      'Tajikistan': 'TJ',
      'Turkmenistan': 'TM',
      'Ukraine': 'UA',
      'Uzbekistan': 'UZ',
      'Argentina': 'AR',
      'Bolivia': 'BO',
      'Chile': 'CL',
      'Colombia': 'CO',
      'Ecuador': 'EC',
      'Guyana': 'GY',
      'Paraguay': 'PY',
      'Peru': 'PE',
      'Suriname': 'SR',
      'Uruguay': 'UY',
      'Venezuela': 'VE',
      'Afghanistan': 'AF',
      'Bangladesh': 'BD',
      'Bhutan': 'BT',
      'Brunei': 'BN',
      'Cambodia': 'KH',
      'Indonesia': 'ID',
      'Laos': 'LA',
      'Malaysia': 'MY',
      'Maldives': 'MV',
      'Myanmar': 'MM',
      'Nepal': 'NP',
      'Pakistan': 'PK',
      'Philippines': 'PH',
      'Singapore': 'SG',
      'Sri Lanka': 'LK',
      'Thailand': 'TH',
      'Timor-Leste': 'TL',
      'Vietnam': 'VN',
      'Algeria': 'DZ',
      'Angola': 'AO',
      'Benin': 'BJ',
      'Botswana': 'BW',
      'Burkina Faso': 'BF',
      'Burundi': 'BI',
      'Cameroon': 'CM',
      'Cape Verde': 'CV',
      'Central African Republic': 'CF',
      'Chad': 'TD',
      'Comoros': 'KM',
      'Congo': 'CG',
      'Democratic Republic of the Congo': 'CD',
      'Djibouti': 'DJ',
      'Egypt': 'EG',
      'Equatorial Guinea': 'GQ',
      'Eritrea': 'ER',
      'Ethiopia': 'ET',
      'Gabon': 'GA',
      'Gambia': 'GM',
      'Ghana': 'GH',
      'Guinea': 'GN',
      'Guinea-Bissau': 'GW',
      'Ivory Coast': 'CI',
      'Kenya': 'KE',
      'Lesotho': 'LS',
      'Liberia': 'LR',
      'Libya': 'LY',
      'Madagascar': 'MG',
      'Malawi': 'MW',
      'Mali': 'ML',
      'Mauritania': 'MR',
      'Mauritius': 'MU',
      'Morocco': 'MA',
      'Mozambique': 'MZ',
      'Namibia': 'NA',
      'Niger': 'NE',
      'Nigeria': 'NG',
      'Rwanda': 'RW',
      'Sao Tome and Principe': 'ST',
      'Senegal': 'SN',
      'Seychelles': 'SC',
      'Sierra Leone': 'SL',
      'Somalia': 'SO',
      'South Africa': 'ZA',
      'South Sudan': 'SS',
      'Sudan': 'SD',
      'Swaziland': 'SZ',
      'Tanzania': 'TZ',
      'Togo': 'TG',
      'Tunisia': 'TN',
      'Uganda': 'UG',
      'Zambia': 'ZM',
      'Zimbabwe': 'ZW',
    };
    
    return countryMap[countryName] || countryName; // Return original if not found
  }

  @Post()
  async create(@Body() createBeneficiaryDto: CreateBeneficiaryDto, @CurrentCaller() caller: Caller) {
    const client = await this.access.assertClient(caller, createBeneficiaryDto.client_id);
    if (createBeneficiaryDto.msb_id !== client.msb_id) {
      throw new ForbiddenException('msb_id does not match the client');
    }
    try {
      // For beneficiaries, we need to create a receiver in BlindPay first
      // Then create a bank account for that receiver
      console.log('--- BlindPay Create Receiver Debug ---');
      
      // Step 1: Create receiver in BlindPay
      const receiverUrl = `${providers.onlineBanking.url}/v2/receivers/${providers.blindpay.instanceId}`;
      // Prepare receiver data based on beneficiary type
      const receiverData: any = {
        type: createBeneficiaryDto.beneficiary_type,
        kyc_type: 'standard',
        email: createBeneficiaryDto.email || 'beneficiary@example.com',
        address_line_1: createBeneficiaryDto.address || '123 Main St',
        city: createBeneficiaryDto.city || 'Unknown',
        state_province_region: createBeneficiaryDto.state || 'NY', // Use state from frontend or default to NY
        country: this.getCountryCode(createBeneficiaryDto.country),
        postal_code: createBeneficiaryDto.postal_code || '12345',
        phone_number: createBeneficiaryDto.phone || '+1234567890',
        external_id: `beneficiary_${Date.now()}`,
      };

      // Add type-specific fields
      if (createBeneficiaryDto.beneficiary_type === 'individual') {
        receiverData.tax_id = createBeneficiaryDto.account_number; // Using account number as tax ID for now
        receiverData.first_name = createBeneficiaryDto.name.split(' ')[0] || createBeneficiaryDto.name;
        receiverData.last_name = createBeneficiaryDto.name.split(' ').slice(1).join(' ') || '';
        // Convert date to ISO datetime format for BlindPay
        const dateOfBirth = createBeneficiaryDto.date_of_birth || '1990-01-01';
        receiverData.date_of_birth = new Date(dateOfBirth + 'T00:00:00.000Z').toISOString();
        receiverData.id_doc_country = createBeneficiaryDto.id_document_country ? this.getCountryCode(createBeneficiaryDto.id_document_country) : this.getCountryCode(createBeneficiaryDto.country);
        receiverData.id_doc_type = createBeneficiaryDto.id_document_type?.toUpperCase() || 'PASSPORT';
        // Add ID document files
        receiverData.id_doc_front_file = createBeneficiaryDto.id_document_front || 'document_front.jpg';
        if (createBeneficiaryDto.id_document_back && createBeneficiaryDto.id_document_back.trim() !== '') {
          receiverData.id_doc_back_file = createBeneficiaryDto.id_document_back;
        }
      } else if (createBeneficiaryDto.beneficiary_type === 'business') {
        receiverData.legal_name = createBeneficiaryDto.legal_name || createBeneficiaryDto.name;
        // Convert formation date to ISO datetime format for BlindPay
        const formationDate = createBeneficiaryDto.formation_date || '2020-01-01';
        receiverData.formation_date = new Date(formationDate + 'T00:00:00.000Z').toISOString();
        receiverData.website = createBeneficiaryDto.website || 'https://example.com';
        
        // Format business owners with proper date formatting
        if (createBeneficiaryDto.owners && createBeneficiaryDto.owners.length > 0) {
          receiverData.owners = createBeneficiaryDto.owners.map((owner: any) => ({
            ...owner,
            date_of_birth: owner.dateOfBirth ? new Date(owner.dateOfBirth + 'T00:00:00.000Z').toISOString() : null
          }));
        } else {
          receiverData.owners = [];
        }
      }

      console.log('Receiver URL:', receiverUrl);
      console.log('Receiver Data:', receiverData);

      const receiverResponse = await fetch(receiverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providers.blindpay.apiKey}`,
          'x-api-key': providers.onlineBanking.xApiKey ?? '',
        },
        body: JSON.stringify(receiverData),
      });

      console.log('Receiver Response Status:', receiverResponse.status);
      
      if (!receiverResponse.ok) {
        const errorText = await receiverResponse.text();
        console.log('Receiver Error Response:', errorText);
        throw new Error('Failed to create receiver in BlindPay');
      }

      const receiver = await receiverResponse.json();
      console.log('Receiver Created:', receiver);

      // Step 2: Create bank account for the receiver
      const bankAccountUrl = `${providers.onlineBanking.url}/v1/instances/${providers.blindpay.instanceId}/receivers/${receiver.id}/bank-accounts`;
      const bankAccountData = {
        type: 'ach', // Default to ACH for beneficiaries
        name: createBeneficiaryDto.name, // Add name field
        beneficiary_name: createBeneficiaryDto.name,
        account_type: createBeneficiaryDto.account_type || 'checking',
        account_class: createBeneficiaryDto.account_class || 'individual', // Use from DTO or default
        routing_number: createBeneficiaryDto.routing_number || createBeneficiaryDto.bank_code || '021000021', // Use routing_number from DTO or fallback to bank_code
        account_number: createBeneficiaryDto.account_number,
      };

      console.log('Bank Account URL:', bankAccountUrl);
      console.log('Bank Account Data:', bankAccountData);

      const bankAccountResponse = await fetch(bankAccountUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providers.blindpay.apiKey}`,
          'x-api-key': providers.onlineBanking.xApiKey ?? '',
        },
        body: JSON.stringify(bankAccountData),
      });

      console.log('Bank Account Response Status:', bankAccountResponse.status);
      
      if (!bankAccountResponse.ok) {
        const errorText = await bankAccountResponse.text();
        console.log('Bank Account Error Response:', errorText);
        throw new Error('Failed to create bank account in BlindPay');
      }

      const bankAccount = await bankAccountResponse.json();
      console.log('Bank Account Created:', bankAccount);

      // Step 3: Save beneficiary to local database
      const beneficiary = this.beneficiaryRepository.create({
        client_id: createBeneficiaryDto.client_id,
        msb_id: createBeneficiaryDto.msb_id,
        name: createBeneficiaryDto.name,
        account_number: createBeneficiaryDto.account_number,
        bank_name: createBeneficiaryDto.bank_name,
        bank_code: createBeneficiaryDto.bank_code,
        country: createBeneficiaryDto.country,
        type: createBeneficiaryDto.type,
        email: createBeneficiaryDto.email,
        phone: createBeneficiaryDto.phone,
        address: createBeneficiaryDto.address,
        beneficiary_type: createBeneficiaryDto.beneficiary_type,
        // Individual-specific fields
        date_of_birth: createBeneficiaryDto.date_of_birth,
        id_document_country: createBeneficiaryDto.id_document_country,
        id_document_type: createBeneficiaryDto.id_document_type,
        id_document_front: createBeneficiaryDto.id_document_front,
        id_document_back: createBeneficiaryDto.id_document_back,
        // Business-specific fields
        legal_name: createBeneficiaryDto.legal_name,
        formation_date: createBeneficiaryDto.formation_date,
        website: createBeneficiaryDto.website,
        owners: createBeneficiaryDto.owners,
        is_verified: true, // Mark as verified since we created it in BlindPay
        blindpay_bank_account_id: bankAccount.id, // Save the BlindPay bank account ID
      });
      
      await this.beneficiaryRepository.save(beneficiary);
      return beneficiary;
    } catch (err) {
      throw new BadRequestException('Failed to create beneficiary: ' + err);
    }
  }

  @Get('list/:clientId')
  async getBeneficiariesByClient(@Param('clientId') clientId: string, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, clientId);
    try {
      const beneficiaries = await this.beneficiaryRepository.find({
        where: { client_id: clientId },
        order: { created_at: 'DESC' }
      });
      return beneficiaries;
    } catch (err) {
      throw new BadRequestException('Failed to get beneficiaries: ' + err);
    }
  }

  @Get('list/msb/:msbId')
  async getBeneficiariesByMsb(@Param('msbId') msbId: string, @CurrentCaller() caller: Caller) {
    this.access.assertMsb(caller, msbId);
    try {
      const beneficiaries = await this.beneficiaryRepository.find({
        where: { msb_id: msbId },
        order: { created_at: 'DESC' }
      });
      return beneficiaries;
    } catch (err) {
      throw new BadRequestException('Failed to get beneficiaries: ' + err);
    }
  }
} 