// RTO Calculation Logic as per Internal Constitution
// Target: 40%, Formula: Required Days = (Total Mon-Fri) - (Holidays + Site-WFH + User Leaves + WFA) * 0.4
// Always round up the final result

export interface RTOCalculationParams {
  totalWeekdays: number;
  holidays: number;
  siteWFH: number;
  userLeaves: number;
  wfa: number;
}

export interface RTOResult {
  requiredDays: number;
  targetPercentage: number;
  totalWorkingDays: number;
  exemptDays: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'at-risk';
}

export const calculateRTO = (params: RTOCalculationParams): RTOResult => {
  const { totalWeekdays, holidays, siteWFH, userLeaves, wfa } = params;
  
  // Calculate exempt days (days that don't count toward RTO requirement)
  const exemptDays = holidays + siteWFH + userLeaves + wfa;
  
  // Calculate total working days available for RTO calculation
  const totalWorkingDays = totalWeekdays - exemptDays;
  
  // Apply 40% target and always round up
  const requiredDays = Math.ceil(totalWorkingDays * 0.4);
  
  // Determine compliance status
  let complianceStatus: 'compliant' | 'non-compliant' | 'at-risk' = 'compliant';
  
  return {
    requiredDays,
    targetPercentage: 40,
    totalWorkingDays,
    exemptDays,
    complianceStatus
  };
};

export const getMonthWeekdays = (year: number, month: number): number => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  let weekdayCount = 0;
  
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      weekdayCount++;
    }
  }
  
  return weekdayCount;
};

export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

export const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};