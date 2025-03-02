import * as OTPAuth from 'otpauth';
import jssha from 'jssha';

// Make jssha available globally (required by otpauth in some environments)
(global as any).jsSHA = jssha;

export function generateTOTP(
  secret: string,
  algorithm: string = 'SHA1',
  digits: number = 6,
  period: number = 30
): string {
  try {
    // Create a new TOTP object
    const totp = new OTPAuth.TOTP({
      issuer: '',
      label: '',
      algorithm: algorithm as OTPAuth.Algorithm,
      digits: digits,
      period: period,
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    
    // Generate the current OTP
    return totp.generate();
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return 'ERROR';
  }
}

export function getTimeRemaining(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

export function parseOTPAuthURL(url: string): {
  name: string;
  issuer: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
} | null {
  let normalizedUrl = '';
  let otpauthUrl = '';

  try {
    // Normalize and validate URL
    normalizedUrl = url.trim();
    
    // Check if this is an otpauth-migration URL and handle it specifically
    if (normalizedUrl.startsWith('otpauth-migration://')) {
      // For otpauth-migration protocol, extract key information
      // This is a simplified implementation - you might need to adjust based on your data format
      try {
        // Extract a query parameter or decode the payload
        const migrationData = normalizedUrl.split('otpauth-migration://offline?data=')[1];
        
        if (!migrationData) {
          throw new Error('Invalid migration data format');
        }
        
        // Migration data might be base64 encoded or have a specific format
        // For this example, we're assuming it contains the needed information
        // You may need to decode/parse this data according to your specific format
        
        // Create a simplified account from migration data
        return {
          name: 'Migrated Account',
          issuer: 'Migration Service',
          secret: migrationData.substring(0, 32), // Extract first 32 chars as secret (simplified)
          algorithm: 'SHA1',
          digits: 6,
          period: 30
        };
      } catch (migrationError) {
        console.error('Error parsing migration data:', migrationError);
        throw new Error('Could not parse migration data');
      }
    }
    
    // Try to extract otpauth:// URL from the input
    const otpauthMatch = normalizedUrl.match(/otpauth:\/\/[^\s"']*/i);
    if (otpauthMatch) {
      otpauthUrl = otpauthMatch[0];
    } else {
      // Try to parse as a query string or JSON
      try {
        // First try as JSON
        const jsonData = JSON.parse(normalizedUrl);
        const secret = jsonData.secret || jsonData.secretKey || jsonData.key;
        const name = jsonData.name || jsonData.account || jsonData.accountName || 'Unknown';
        const issuer = jsonData.issuer || jsonData.service || jsonData.provider || '';
        
        if (!secret) throw new Error('No secret found in JSON');
        
        // Construct otpauth URL from JSON data
        otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(name)}?secret=${secret}`;
        if (jsonData.algorithm) otpauthUrl += `&algorithm=${jsonData.algorithm}`;
        if (jsonData.digits) otpauthUrl += `&digits=${jsonData.digits}`;
        if (jsonData.period) otpauthUrl += `&period=${jsonData.period}`;
        if (issuer) otpauthUrl += `&issuer=${encodeURIComponent(issuer)}`;
      } catch (jsonError) {
        // Try as query string
        try {
          // Handle both full URLs and just query strings
          const queryStr = normalizedUrl.includes('?') 
            ? normalizedUrl.split('?')[1] 
            : normalizedUrl;
          
          const params = new URLSearchParams(queryStr);
          const secret = params.get('secret') || params.get('key');
          const name = params.get('name') || params.get('account') || 'Unknown';
          const issuer = params.get('issuer') || params.get('service') || '';
          
          if (!secret) throw new Error('No secret found in parameters');
          
          // Construct otpauth URL from parameters
          otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(name)}?secret=${secret}`;
          if (params.get('algorithm')) otpauthUrl += `&algorithm=${params.get('algorithm')}`;
          if (params.get('digits')) otpauthUrl += `&digits=${params.get('digits')}`;
          if (params.get('period')) otpauthUrl += `&period=${params.get('period')}`;
          if (issuer) otpauthUrl += `&issuer=${encodeURIComponent(issuer)}`;
        } catch (queryError) {
          // If both JSON and query string parsing fail, try as a raw secret
          const cleanSecret = normalizedUrl.replace(/[^A-Z2-7]/gi, '');
          if (cleanSecret.length >= 16) {
            otpauthUrl = `otpauth://totp/Unknown?secret=${cleanSecret}`;
          } else {
            throw new Error('Invalid OTP Auth URL format');
          }
        }
      }
    }

    // Add missing type if needed
    if (normalizedUrl.toLowerCase().startsWith('otpauth://') && 
        !normalizedUrl.toLowerCase().startsWith('otpauth://totp/') && 
        !normalizedUrl.toLowerCase().startsWith('otpauth://hotp/')) {
      normalizedUrl = normalizedUrl.replace('otpauth://', 'otpauth://totp/');
    }

    // Add missing type if needed
    if (!otpauthUrl.toLowerCase().includes('/totp/') && !otpauthUrl.toLowerCase().includes('/hotp/')) {
      otpauthUrl = otpauthUrl.replace('otpauth://', 'otpauth://totp/');
    }

    // Parse the OTP Auth URL
    const parsedOtp = OTPAuth.URI.parse(otpauthUrl);
    
    // Validate OTP type
    if (!parsedOtp.type) {
      // Default to TOTP if type is missing
      parsedOtp.type = 'totp';
    }
    
    // Handle different OTP types
    const otpType = parsedOtp.type.toLowerCase();
    if (otpType !== 'totp' && otpType !== 'hotp') {
      throw new Error(`Unsupported OTP type: ${parsedOtp.type}. Only TOTP and HOTP are supported.`);
    }
    
    // Validate required fields
    if (!parsedOtp.secret) {
      // Try to extract secret from query parameters
      const urlObj = new URL(normalizedUrl);
      const secret = urlObj.searchParams.get('secret');
      if (secret) {
        parsedOtp.secret = OTPAuth.Secret.fromBase32(secret);
      } else {
        throw new Error('Missing secret key');
      }
    }
    
    // Extract label parts (format can be "issuer:account" or just "account")
    let accountName = parsedOtp.label || '';
    let issuerName = parsedOtp.issuer || '';

    // Try to extract issuer from URL parameters if not in standard location
    if (!issuerName) {
      try {
        const urlObj = new URL(otpauthUrl);
        issuerName = urlObj.searchParams.get('issuer') || '';
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // If label contains issuer info (issuer:account format)
    const labelParts = accountName.split(':');
    if (labelParts.length > 1) {
      // If no explicit issuer was provided, use the one from label
      if (!issuerName) {
        issuerName = labelParts[0].trim();
      }
      accountName = labelParts[1].trim();
    }
    
    // Try to extract account name from the path if not found
    if (!accountName) {
      try {
        const pathParts = new URL(otpauthUrl).pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'totp' && lastPart !== 'hotp') {
          accountName = decodeURIComponent(lastPart);
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Ensure we have at least some identifier
    if (!accountName && !issuerName) {
      accountName = 'Unknown Account';
      issuerName = 'Unknown Service';
    }
    
    return {
      name: accountName,
      issuer: issuerName,
      secret: parsedOtp.secret.base32,
      algorithm: parsedOtp.algorithm || 'SHA1',
      digits: parsedOtp.digits || 6,
      period: parsedOtp.period || 30
    };
  } catch (error) {
    // Log the full error for debugging
    console.error('Error parsing OTP Auth URL:', {
      error,
      url: url.substring(0, 50) + '...',
      type: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      normalizedUrl: normalizedUrl ? normalizedUrl.substring(0, 50) + '...' : '',
      otpauthUrl: otpauthUrl ? otpauthUrl.substring(0, 50) + '...' : ''
    });
    
    // Re-throw with a more specific error message
    if (error instanceof Error) {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid OTP Auth URL format')) {
        throw new Error('The QR code does not contain a valid authentication URL. Please check the format.');
      } else if (error.message.includes('Missing secret key')) {
        throw new Error('The QR code is missing the required secret key. Please ensure it contains a valid secret.');
      } else if (error.message.includes('Unsupported OTP type')) {
        throw new Error('This type of authentication is not supported. Please use TOTP or HOTP.');
      } else if (error.message.includes('Missing OTP type')) {
        // Try to recover by assuming TOTP
        try {
          const modifiedUrl = normalizedUrl.replace('otpauth://', 'otpauth://totp/');
          return parseOTPAuthURL(modifiedUrl);
        } catch (retryError) {
          throw new Error('Could not determine the authentication type. Please check the QR code.');
        }
      }
      throw error;
    }
    
    return null;
  }
}
