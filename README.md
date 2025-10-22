# 🏥 Hospital Shift Scheduler

An intelligent web application for generating hospital shift schedules with constraint satisfaction and fair distribution.

## Features

- **Automatic Schedule Generation**: Generates monthly schedules based on configurable rules
- **Constraint Satisfaction**: Ensures all scheduling rules are followed:
  - 36 hours per week average per nurse
  - 3 nurses for day shifts (07:00-19:00)
  - 2 nurses for night shifts (19:00-07:00)
  - Minimum 1-2 days off after night shifts
  - Limited consecutive shifts
  - No night-to-day transitions (configurable)
- **Fair Distribution**: Balances workload across all nurses
- **Visual Calendar**: Interactive calendar showing all shifts and assignments
- **Real-time Statistics**: Track hours, shift counts, and balance per nurse
- **15 Mock Nurses**: Pre-loaded with sample data for testing

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns
- **State Management**: React Context API

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Configure Rules**: Adjust scheduling parameters in the left panel
   - Staff requirements per shift
   - Target hours per week
   - Rest period requirements
   - Consecutive shift limits

2. **View Schedule**: The calendar shows all shifts for the current month
   - Yellow boxes: Day shifts
   - Blue boxes: Night shifts
   - Names show assigned nurses

3. **Monitor Statistics**: The nurse list shows:
   - Total shifts worked
   - Day vs night shift distribution
   - Total hours
   - Average hours per week (compared to target)

4. **Regenerate**: Click "Regenerate Schedule" to create a new schedule with current rules

## Scheduling Algorithm

The application uses a greedy algorithm with fairness considerations:

1. **Shift Creation**: Creates all day and night shifts for the month
2. **Constraint Checking**: For each shift, checks which nurses can be assigned based on:
   - Availability
   - Rest period requirements
   - Consecutive shift limits
   - Transition rules (night→day blocked)
3. **Fair Assignment**: Prioritizes nurses with fewer hours to balance workload
4. **Validation**: Ensures all constraints are satisfied

## Project Structure

```
src/
├── algorithms/          # Scheduling logic
│   ├── scheduleGenerator.ts
│   └── constraintChecker.ts
├── components/          # React components
│   ├── RulesConfig/
│   ├── NurseList/
│   └── ScheduleCalendar/
├── context/            # React context
│   └── ScheduleContext.tsx
├── hooks/              # Custom hooks
│   └── useSchedule.ts
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Helper functions
│   ├── dateHelpers.ts
│   ├── statistics.ts
│   └── mockData.ts
├── App.tsx
└── main.tsx
```

## Future Enhancements

- Manual shift adjustments
- Export to PDF/CSV
- Multi-month generation
- Nurse preferences and constraints
- Shift swap functionality
- Historical schedule tracking
- Advanced optimization algorithms

## License

MIT

