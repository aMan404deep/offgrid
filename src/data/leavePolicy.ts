export const ARRISE_LEAVE_POLICY_TEXT = `
# Arrise Solutions (India) Pvt. Ltd. - Leave Policy
## Noida, Hyderabad & Kolkata – India

### 1. Version Control
- Date: July 28, 2025
- Track: Entire Document
- Authored by: Ayessha Bhatta
- Reviewed by: Monica Varshney
- Approved by: Ankit Mathuria
- Version: 1.0

### 2. Objective
This policy outlines the guidelines for availing leave for employees of Arrise Solutions (India) Pvt. Ltd. It is designed to promote employee well-being by ensuring adequate time off for rest, personal needs, health, and family responsibilities.
Employees are required to submit leave applications through the HRMS, providing reasonable notice in advance. All leave requests must be approved by the respective Reporting Manager prior to availing the leave.

### 3. Scope
This leave policy applies to all full-time employees and interns of Arrise Solutions (India) Pvt. Ltd.

### 4. Type of Leaves entitlements:

#### 4.1 Casual / Sick Leave (CL / SL)
- Employees are entitled to 12 working days per year, credited in advance on a pro-rata basis based on the date of joining or financial year.
- CL / SL can be clubbed with other leave types and availed as FD (Full Day) or HD (Half Day).
- Unutilized CL / SL will not be encashed and will lapse at the end of the financial year.
- Strictly prioritize utilising CL / SL before Earned Leave because unutilised CL / SL lapses and cannot be encashed.

#### 4.2 Earned Leave (EL)
*FTE –*
- Eligible for 1 EL per month, credited on a pro-rata basis.
- EL can be clubbed with any other leave type and availed as FD or HD.
- Unutilized EL will be carried forward to the next financial year.
- EL can accumulate up to a maximum of 40 days. Any leave beyond this limit will continue to accrue monthly but will automatically lapse at the end of the financial year.
- During Full & Final (F&F) settlement, up to 40 days of accumulated EL can be encashed, calculated on Basic Pay only.
*Interns –*
- Eligible for 1 EL per month.
- Unutilized EL will not be encashed and will lapse at the end of each month.

#### 4.3 Maternity Leave (ML)
- Applicable to all female employees for a maximum of first 2 child's birth.
- To be eligible, the employee must have worked for at least 80 calendar days in the 12 months preceding the expected date of delivery.
- Eligible employees are entitled to 26 weeks of paid ML.
- During this period, the employee will continue to receive her full salary.
- Leave beyond 26 weeks must be adjusted against available leave balances; if no leave is available, the additional duration will be treated as Leave Without Pay (LOP).
- Adoption Clause: A female employee who legally adopts a child or a commissioning mother shall be entitled to maternity benefit for a period of twelve weeks from the date the child is handed over to the adopting mother. Adoption leave is applicable only for the first 2 legal adoptions.

#### 4.4 Paternity Leave (PL)
- Male employees are entitled to 10 working days of PL, which can be availed across the pregnancy and delivery period of their spouse.
- PL can be availed within 6 months of child’s birth.
- PL can be taken as FD or HD or in breaks and can be clubbed with other leave types.
- Unutilized PL will not be encashed and will lapse at the end of the financial year.
- Adoption Clause: A male employee who legally adopts a child shall be entitled to adoption benefit for a period of 10 days of paid leave.

#### 4.5 Bereavement Leave (BL)
- Employees are entitled to 5 working days of BL in the unfortunate event of the death of immediate family members, including parents, siblings, spouse, children, and in-laws.
- Unutilized BL will not be encashed and will lapse at the end of the financial year.

#### 4.6 Relocation Leave (RL)
- Employees are eligible for 3 working days of RL in the event of a job-related transfer or movement.
- RL must be availed within 1 year from the date of relocation/transfer/joining.
- Unutilized RL will not be encashed and will lapse at the end of duration.

#### 4.7 Statutory Holidays
- Employees are eligible for paid public holidays per calendar year as listed in the official Holiday List.
- Floater Leave option: allows employees to exchange any two holidays marked in the FIXED holiday list with holidays in the floater list based on personal preferences or regional/religious observances.

#### 4.8 Compensatory Off (Comp-Off)
- Employees who work on weekends or company-declared holidays are eligible for Comp-Off.
- Prior approval from the Reporting Manager is mandatory.
- Comp-Off must be availed within 90 days from the date it is earned. Unused Comp-Off will lapse automatically.
- All Comp-Off requests must be recorded and applied through the HRMS.
- Full-Day Comp-Off: Worked more than 7.5 hours.
- Half-Day Comp-Off: Worked between 4.5 to 7.5 hours.

#### 4.9 Loss of Pay (LOP)
- LOP refers to leave taken beyond the available leave (CL/SL & EL only) balance.
- Any absence without sufficient leave balance will result in a deduction from the employee’s salary.
- LOP days will impact monthly salary, annual leave accruals and bonus eligibility.
- Frequent or unapproved LOPs may lead to disciplinary action.
`;

export interface HolidayEntry {
  date: string;
  name: string;
  type: 'Fixed' | 'Floater' | 'Weekend';
  regions: string[]; // Noida, Hyderabad, Kolkata
}

export const REGIONAL_HOLIDAYS_2026: HolidayEntry[] = [
  { date: '2026-01-26', name: 'Republic Day', type: 'Fixed', regions: ['Noida', 'Hyderabad', 'Kolkata'] },
  { date: '2026-03-17', name: 'Holi', type: 'Fixed', regions: ['Noida', 'Kolkata'] },
  { date: '2026-04-02', name: 'Good Friday', type: 'Fixed', regions: ['Noida', 'Hyderabad', 'Kolkata'] },
  { date: '2026-05-01', name: 'May Day', type: 'Floater', regions: ['Kolkata', 'Hyderabad'] },
  { date: '2026-08-15', name: 'Independence Day', type: 'Fixed', regions: ['Noida', 'Hyderabad', 'Kolkata'] },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'Fixed', regions: ['Noida', 'Hyderabad', 'Kolkata'] },
  { date: '2026-10-10', name: 'Dussehra / Durga Puja', type: 'Fixed', regions: ['Kolkata', 'Noida', 'Hyderabad'] },
  { date: '2026-11-09', name: 'Diwali', type: 'Fixed', regions: ['Noida', 'Hyderabad', 'Kolkata'] },
  { date: '2026-12-25', name: 'Christmas Day', type: 'Fixed', regions: ['Noida', 'Hyderabad', 'Kolkata'] },
  { date: '2026-04-14', name: 'Tamil New Year / Vishu', type: 'Floater', regions: ['Hyderabad'] },
  { date: '2026-06-21', name: 'Rath Yatra', type: 'Floater', regions: ['Kolkata'] },
  { date: '2026-10-23', name: 'Guru Nanak Jayanti', type: 'Floater', regions: ['Noida'] },
];
