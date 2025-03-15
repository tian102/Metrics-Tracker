<?php
require_once 'includes/config.php';
require_once 'includes/db.php';

/**
 * Import exercise library data to the database
 */
function importExerciseLibrary() {
    $db = new Database();
    
    // CSV data - this would be the content from the paste.txt file
    $csvData = "Muscle Group,Equipment,Exercise
Abdominals,Barbell,Barbell Landmine Side Bend
Abdominals,Barbell,Barbell Roll Outs
Abdominals,Barbell,Barbell Situp
Abdominals,Barbell,Landmine Hollow Hold
Abdominals,Barbell,Landmine Kneeling Twist
Abdominals,Barbell,Landmine Oblique Twist
Abdominals,Barbell,Landmine Russian Twist
Abdominals,Barbell,Landmine Sit Up
Abdominals,Barbell,Landmine Stationary Twist
Abdominals,Bodyweight,Alternating Bent Leg Raise
Abdominals,Bodyweight,Alternating Heel Touch
Abdominals,Bodyweight,Bicycle Crunch
Abdominals,Bodyweight,Bird Dog
Abdominals,Bodyweight,Bodyweight Hanging Knee Tuck
Abdominals,Bodyweight,Bodyweight Hanging L Sit
Abdominals,Bodyweight,Bodyweight Knee Plank Up Down
Abdominals,Bodyweight,Bodyweight Plank Up Down
Abdominals,Bodyweight,Bodyweight Russian Twist
Abdominals,Bodyweight,Bodyweight Situp
Abdominals,Bodyweight,Burpee
Abdominals,Bodyweight,Crunches
Abdominals,Bodyweight,Dead Bug
Abdominals,Bodyweight,Eccentric Dragonflag
Abdominals,Bodyweight,Elbow Plank Mountain Climber
Abdominals,Bodyweight,Elbow Side Plank
Abdominals,Bodyweight,Forearm Plank
Abdominals,Bodyweight,Frog Crunch
Abdominals,Bodyweight,Frog Sit Up
Abdominals,Bodyweight,Hand Plank
Abdominals,Bodyweight,Hand Side Plank
Abdominals,Bodyweight,Hand Side Plank Reach Through
Abdominals,Bodyweight,Hanging Knee Raises
Abdominals,Bodyweight,Hollow Hold
Abdominals,Bodyweight,Jumping Mountain Climber
Abdominals,Bodyweight,Laying Alternating Leg Raise
Abdominals,Bodyweight,Laying Bent Leg Raise
Abdominals,Bodyweight,Laying Leg Raises
Abdominals,Bodyweight,Long Lever Forearm Plank
Abdominals,Bodyweight,Long Lever Plank
Abdominals,Bodyweight,Mountain Climber
Abdominals,Bodyweight,Oblique Crunch
Abdominals,Bodyweight,Oblique Jackknife
Abdominals,Bodyweight,Plank 2 Saw
Abdominals,Bodyweight,Reach And Catch
Abdominals,Bodyweight,Reverse Crunch
Abdominals,Bodyweight,Reverse Crunch Kick Up
Abdominals,Bodyweight,Ring Standing Roll Out
Abdominals,Bodyweight,Scissor Kick
Abdominals,Bodyweight,Side Plank Reach Through
Abdominals,Bodyweight,Side Plank Up Down
Abdominals,Bodyweight,Sideways Scissor Kick
Abdominals,Bodyweight,Slalom Mountain Climber
Abdominals,Bodyweight,Slow Tempo Mountain Climber
Abdominals,Bodyweight,Switch Jump Mountain Climber
Abdominals,Bodyweight,Windshield Wiper
Abdominals,Cables,Cable Half Kneeling High To Low Wood Chopper
Abdominals,Cables,Cable Half Kneeling Low To High Wood Chopper
Abdominals,Cables,Cable Half Kneeling Wood Chopper
Abdominals,Cables,Cable Oblique Pushdown
Abdominals,Cables,Cable Pallof Press
Abdominals,Cables,Cable Pallof Press Rotation
Abdominals,Cables,Cable Rope Kneeling Crunch
Abdominals,Cables,Cable Rope Kneeling Oblique Crunch
Abdominals,Cables,Cable Row Bar Kneeling Crunch
Abdominals,Cables,Cable Side Bend
Abdominals,Cables,Cable Standing Crunch
Abdominals,Cables,Cable Wood Chopper
Abdominals,Dumbbells,Dumbbell Crunch
Abdominals,Dumbbells,Dumbbell Elbow Side Plank
Abdominals,Dumbbells,Dumbbell Half Kneeling Wood Chopper
Abdominals,Dumbbells,Dumbbell Hand Side Plank
Abdominals,Dumbbells,Dumbbell Hollow Hold
Abdominals,Dumbbells,Dumbbell Kneeling Wood Chopper
Abdominals,Dumbbells,Dumbbell Long Lever Russian Twist
Abdominals,Dumbbells,Dumbbell Overhead Side Bend
Abdominals,Dumbbells,Dumbbell Plank Pullthrough
Abdominals,Dumbbells,Dumbbell Renegade Row
Abdominals,Dumbbells,Dumbbell Russian Twist
Abdominals,Dumbbells,Dumbbell Side Bend
Abdominals,Dumbbells,Dumbbell Side Plank Up Down
Abdominals,Dumbbells,Dumbbell Situp
Abdominals,Dumbbells,Dumbbell Suitcase Crunch
Abdominals,Dumbbells,Dumbbell Wood Chopper
Abdominals,Dumbbells,Plank Iytw
Abdominals,Dumbbells,Pushup To Renegade Row
Abdominals,Machine,Machine Roll Outs
Abdominals,Machine,Rower Knee Tuck
Abdominals,Machine,Rower Pike
Abdominals,Smith Machine,Smith Machine Hanging Knee Tuck
Abdominals,Smith Machine,Smith Machine Oblique Crunch
Abdominals,Smith Machine,Smith Machine Reverse Crunch Hip Raise
Abdominals,Smith Machine,Smith Machine Side Bend
Abdominals,Smith Machine,Smith Machine Side Plank Up Down
Abdominals,Smith Machine,Smith Machine Situp
Biceps,Barbell,Barbell Bent Over Row
Biceps,Barbell,Barbell Curl
Biceps,Barbell,Barbell Drag Curl
Biceps,Barbell,Barbell Landmine Row
Biceps,Barbell,Barbell Long Landmine Row
Biceps,Barbell,Barbell Meadows Row
Biceps,Barbell,Barbell Pronated Pendlay Row
Biceps,Barbell,Barbell Pronated Row
Biceps,Barbell,Barbell Reverse Curl
Biceps,Barbell,Barbell Supinated Pendlay Row
Biceps,Barbell,Barbell Supinated Row
Biceps,Barbell,Ez Bar Preacher Curl
Biceps,Barbell,Ez Bar Reverse Preacher Curl
Biceps,Barbell,Landmine Bicep Curl
Biceps,Barbell,Landmine Concentration Curl
Biceps,Barbell,Landmine T Bar Rows
Biceps,Bodyweight,Bodyweight Assisted Chin Up
Biceps,Bodyweight,Bodyweight Assisted Gironda Chin Up
Biceps,Bodyweight,Bodyweight Assisted Mixed Grip Pullup
Biceps,Bodyweight,Bodyweight Assisted Pull Up
Biceps,Bodyweight,Bodyweight Close Grip Inverted Curl
Biceps,Bodyweight,Bodyweight Concentration Curl
Biceps,Bodyweight,Bodyweight Inverted Curl
Biceps,Bodyweight,Bodyweight Underhand Inverted Row
Biceps,Bodyweight,Chin Ups
Biceps,Bodyweight,Ring Curl
Biceps,Bodyweight,Ring Row
Biceps,Cables,Cable Archer Row
Biceps,Cables,Cable Bar Curl
Biceps,Cables,Cable Bilateral Bayesian Curl
Biceps,Cables,Cable Hammer Bayesian Curl
Biceps,Cables,Cable Pull In
Biceps,Cables,Cable Reverse Bayesian Curl
Biceps,Cables,Cable Rope Hammer Curl
Biceps,Cables,Cable Row Bar Standing Row
Biceps,Cables,Cable Seated Bayesian Curl
Biceps,Cables,Cable Seated Bayesian Hammer Curl
Biceps,Cables,Cable Seated Bayesian Reverse Curl
Biceps,Cables,Cable Single Arm Bayesian Curl
Biceps,Cables,Cable Single Arm Hammer Curl
Biceps,Cables,Cable Single Arm Neutral Grip Row
Biceps,Cables,Cable Single Arm Reverse Curl
Biceps,Cables,Cable Single Arm Underhand Grip Row
Biceps,Cables,Cable Supinating Row
Biceps,Cables,Cable Twisting Curl
Biceps,Dumbbells,Dumbbell Alternating Pendlay Row
Biceps,Dumbbells,Dumbbell Concentration Curl
Biceps,Dumbbells,Dumbbell Curl
Biceps,Dumbbells,Dumbbell Hammer Curl
Biceps,Dumbbells,Dumbbell Incline Hammer Curl
Biceps,Dumbbells,Dumbbell Incline Reverse Curl
Biceps,Dumbbells,Dumbbell Incline Zottman Curl
Biceps,Dumbbells,Dumbbell Knee Lawnmower Row
Biceps,Dumbbells,Dumbbell Kneeling Single Arm Row
Biceps,Dumbbells,Dumbbell Laying Incline Row
Biceps,Dumbbells,Dumbbell Pendlay Row
Biceps,Dumbbells,Dumbbell Preacher Curl
Biceps,Dumbbells,Dumbbell Rear Delt Row
Biceps,Dumbbells,Dumbbell Reverse Curl
Biceps,Dumbbells,Dumbbell Single Arm Preacher Curl
Biceps,Dumbbells,Dumbbell Single Arm Row
Biceps,Dumbbells,Dumbbell Single Arm Row Knee
Biceps,Dumbbells,Dumbbell Single Arm Spider Curl
Biceps,Dumbbells,Dumbbell Spider Curl
Biceps,Dumbbells,Dumbbell Supinated Row
Biceps,Dumbbells,Dumbbell Twisting Curl
Biceps,Dumbbells,Lawnmower Row
Biceps,Machine,Machine Assisted Chin Up
Biceps,Machine,Machine Assisted Narrow Pull Up
Biceps,Machine,Machine Assisted Neutral Chin Up
Biceps,Machine,Machine Assisted Pull Up
Biceps,Machine,Machine Seated Cable Row
Biceps,Machine,Machine Underhand Row
Biceps,Machine,Narrow Pulldown
Biceps,Machine,Neutral Pulldown
Biceps,Machine,Underhand Pulldown
Biceps,Smith Machine,Smith Machine Drag Curl
Biceps,Smith Machine,Smith Machine Overhand Row
Biceps,Smith Machine,Smith Machine Underhand Row
Calves,Barbell,Barbell Calf Jump
Calves,Barbell,Barbell Calf Raises
Calves,Barbell,Barbell Seated Calf Raise
Calves,Barbell,Barbell Toes Up Calf Raise
Calves,Barbell,Landmine Calf Raise
Calves,Barbell,Standing Tibialis Raise
Calves,Bodyweight,Bodyweight Donkey Calf Raise
Calves,Bodyweight,Calf Raises
Calves,Bodyweight,Seated Tibialis Raise
Calves,Bodyweight,Tip Toe Walking
Calves,Bodyweight,Walking Calf Raises
Calves,Cables,Cable Bar Calve Raise
Calves,Cables,Cable Calve Raise
Calves,Dumbbells,Dumbbell Calf Raise
Calves,Dumbbells,Dumbbell Seated Calf Raise
Calves,Dumbbells,Dumbbell Seated Tibialis Raise
Calves,Dumbbells,Dumbbell Standing Tibialis Raise
Calves,Machine,Machine Horizontal Leg Press Calf Jump
Calves,Machine,Machine Horizontal Leg Press Calf Raise
Calves,Machine,Machine Seated Calf Raises
Calves,Machine,Machine Standing Calf Raises
Calves,Smith Machine,Smith Machine Calf Raise
Calves,Smith Machine,Smith Machine Seated Calf Raise
Chest,Barbell,Barbell Larsen Bench Press
Chest,Barbell,Barbell Hooklying Bench Press
Chest,Barbell,Barbell Bench Press
Chest,Bodyweight,Push Up
Chest,Bodyweight,Ring Standing Chest Fly
Chest,Cables,Cable Bench Chest Fly
Chest,Cables,Cable Decline Bench Chest Fly
Chest,Cables,Cable Incline Bench Press
Chest,Cables,Cable Incline Chest Fly
Chest,Cables,Cable Pec Fly
Chest,Cables,Cable Single Arm Bench Chest Fly
Chest,Cables,Cable Single Arm Decline Bench Chest Fly
Chest,Cables,Cable Single Arm Incline Chest Fly
Chest,Dumbbells,Dumbbell Chest Fly
Chest,Dumbbells,Dumbbell Decline Chest Fly
Chest,Dumbbells,Dumbbell Incline Chest Fly
Chest,Dumbbells,Dumbbell Internally Rotated Chest Fly
Chest,Dumbbells,Dumbbell Internally Rotated Incline Chest Fly
Chest,Machine,Machine Pec Fly
Chest,Smith Machine,Smith Machine Pushup
Chest,Dumbbells,Dumbbell Decline Neutral Bench Press
Forearms,Barbell,Barbell Behind The Back Wrist Curl
Forearms,Barbell,Barbell Wrist Curl
Forearms,Barbell,Barbell Wrist Extension
Forearms,Cables,Cable Bar Reverse Grip Curl
Forearms,Cables,Cable Wrist Curl
Forearms,Cables,Cable Wrist Extension
Forearms,Dumbbells,Dumbbell Bench Wrist Curl
Forearms,Dumbbells,Dumbbell Bench Wrist Extension
Forearms,Dumbbells,Dumbbell Wrist Curl
Forearms,Dumbbells,Dumbbell Wrist Extension
Forearms,Dumbbells,Wrist Flexor Curl Dumbbell Kneeling
Forearms,Dumbbells,Wrist Supinations Pronations
Glutes,Barbell,Barbell Bulgarian Split Squat
Glutes,Barbell,Barbell Curtsy Lunge
Glutes,Barbell,Barbell Feet Elevated Figure Four Glute Bridge
Glutes,Barbell,Barbell Feet Elevated Glute Bridge
Glutes,Barbell,Barbell Feet Elevated Single Leg Glute Bridge
Glutes,Barbell,Barbell Feet Elevated Staggered Glute Bridge
Glutes,Barbell,Barbell Figure Four Heels Elevated Hip Thrust
Glutes,Barbell,Barbell Figure Four Hip Thrust
Glutes,Barbell,Barbell Forward Lunge
Glutes,Barbell,Barbell Front Rack Step Up
Glutes,Barbell,Barbell Front Squat Bodybuilding
Glutes,Barbell,Barbell Front Squat With Straps
Glutes,Barbell,Barbell Glute Bridge
Glutes,Barbell,Barbell Heels Elevated Hip Thrust
Glutes,Barbell,Barbell Heels Up Back Squat
Glutes,Barbell,Barbell Heels Up Front Squat
Glutes,Barbell,Barbell High Bar Squat
Glutes,Barbell,Barbell Hip Thrust
Glutes,Barbell,Barbell Kickstand Squat
Glutes,Barbell,Barbell Lateral Lunge
Glutes,Barbell,Barbell Reverse Lunge
Glutes,Barbell,Barbell Side Step Up
Glutes,Barbell,Barbell Single Leg Heels Elevated Hip Thrust
Glutes,Barbell,Barbell Single Leg Hip Thrust
Glutes,Barbell,Barbell Split Squat
Glutes,Barbell,Barbell Squat
Glutes,Barbell,Barbell Step Up
Glutes,Barbell,Barbell Step Up Balance
Glutes,Barbell,Barbell Stiff Leg Deadlifts
Glutes,Barbell,Barbell Tap Pause Squat
Glutes,Barbell,Landmine Alternating Lunge And Twist
Glutes,Barbell,Landmine Alternating Lunge To Chest Press
Glutes,Barbell,Landmine Curtsy Lunge
Glutes,Barbell,Landmine Glute Kick Back
Glutes,Barbell,Landmine Goblet Curtsy Lunge
Glutes,Barbell,Landmine Goblet Lateral Lunge
Glutes,Barbell,Landmine Hack Squat
Glutes,Barbell,Landmine Lateral Lunge
Glutes,Barbell,Landmine Lunge
Glutes,Barbell,Landmine Lunge To Overhead Press
Glutes,Barbell,Landmine Rotational Lift To Press
Glutes,Barbell,Landmine Single Leg Glute Bridge
Glutes,Barbell,Landmine Squat
Glutes,Barbell,Landmine Sumo Deadlift
Glutes,Barbell,Landmine Thruster
Glutes,Bodyweight,Assisted Bulgarian Split Squat
Glutes,Bodyweight,Bodyweight Alternating Curtsy Lunge
Glutes,Bodyweight,Bodyweight Alternating Jump Lunge
Glutes,Bodyweight,Bodyweight Alternating Lateral Lunge
Glutes,Bodyweight,Bodyweight Alternating Reverse Lunges
Glutes,Bodyweight,Bodyweight Box Squat
Glutes,Bodyweight,Bodyweight Feet Elevated Figure Four Glute Bridge
Glutes,Bodyweight,Bodyweight Feet Elevated Glute Bridge
Glutes,Bodyweight,Bodyweight Feet Elevated Single Leg Glute Bridge
Glutes,Bodyweight,Bodyweight Feet Elevated Staggered Glute Bridge
Glutes,Bodyweight,Bodyweight Figure Four Heels Elevated Hip Thrust
Glutes,Bodyweight,Bodyweight Heels Elevated Hip Thrust
Glutes,Bodyweight,Bodyweight Hip Abduction
Glutes,Bodyweight,Bodyweight Kickstand Squat
Glutes,Bodyweight,Bodyweight Lateral Lunge Jump
Glutes,Bodyweight,Bodyweight Pop Squat
Glutes,Bodyweight,Bodyweight Pulse Squat
Glutes,Bodyweight,Bodyweight Single Leg Heels Elevated Hip Thrust
Glutes,Bodyweight,Bodyweight Swing Lunge
Glutes,Bodyweight,Bodyweight Swingthrough Lunge
Glutes,Bodyweight,Box Jump
Glutes,Bodyweight,Bulgarian Split Squat
Glutes,Bodyweight,Curtsy Lunge
Glutes,Bodyweight,Depth Jump
Glutes,Bodyweight,Forward Lunge
Glutes,Bodyweight,Forward Lunges
Glutes,Bodyweight,Glute Bridge
Glutes,Bodyweight,Glute Bridge Eccentric Unilateral
Glutes,Bodyweight,Glute Bridge Isometric Hold Single Alternate
Glutes,Bodyweight,Hamstring Bridge Isometric Open Angle
Glutes,Bodyweight,Hamstring Bridge With Elevated Legs Box Bilateral
Glutes,Bodyweight,Hamstring Bridge With Elevated Legs Box Unilateral
Glutes,Bodyweight,Heels Up Squat
Glutes,Bodyweight,In And Out Jump Squat
Glutes,Bodyweight,Jump Squats
Glutes,Bodyweight,Kickbacks
Glutes,Bodyweight,Lateral Lunge
Glutes,Bodyweight,Lunge Alternate
Glutes,Bodyweight,Lunge Walking
Glutes,Bodyweight,Pole Overhead Squat
Glutes,Bodyweight,Seated Box Jump
Glutes,Bodyweight,Side Lunges
Glutes,Bodyweight,Single Leg Box Jump
Glutes,Bodyweight,Single Leg Glute Bridge
Glutes,Bodyweight,Split Squat
Glutes,Bodyweight,Step Up Knee Drive
Glutes,Cables,Cable Quadruped Hip Abduction
Glutes,Cables,Cable Split Squat
Glutes,Cables,Cable Standing Glute Kickback
Glutes,Cables,Cable Standing Hip Abduction
Glutes,Cables,Cable Standing Hip Adduction
Glutes,Dumbbells,Dumbbell Bulgarian Split Squat
Glutes,Dumbbells,Dumbbell Feet Elevated Figure Four Glute Bridge
Glutes,Dumbbells,Dumbbell Feet Elevated Glute Bridge
Glutes,Dumbbells,Dumbbell Feet Elevated Single Leg Glute Bridge
Glutes,Dumbbells,Dumbbell Feet Elevated Staggered Glute Bridge
Glutes,Dumbbells,Dumbbell Figure Four Glute Bridge
Glutes,Dumbbells,Dumbbell Figure Four Heels Elevated Hip Thrust
Glutes,Dumbbells,Dumbbell Figure Four Hip Thrust
Glutes,Dumbbells,Dumbbell Forward Lunge
Glutes,Dumbbells,Dumbbell Front Rack Squat
Glutes,Dumbbells,Dumbbell Front Rack Step Up
Glutes,Dumbbells,Dumbbell Glute Bridge
Glutes,Dumbbells,Dumbbell Goblet Bulgarian Split Squat
Glutes,Dumbbells,Dumbbell Goblet Curtsy Lunge
Glutes,Dumbbells,Dumbbell Goblet Forward Lunge
Glutes,Dumbbells,Dumbbell Goblet Lateral Lunge
Glutes,Dumbbells,Dumbbell Goblet Pulse Squat
Glutes,Dumbbells,Dumbbell Goblet Reverse Lunge
Glutes,Dumbbells,Dumbbell Goblet Side Step Up
Glutes,Dumbbells,Dumbbell Goblet Split Squat
Glutes,Dumbbells,Dumbbell Goblet Squat
Glutes,Dumbbells,Dumbbell Goblet Step Up
Glutes,Dumbbells,Dumbbell Heels Elevated Hip Thrust
Glutes,Dumbbells,Dumbbell Heels Up Goblet Squat
Glutes,Dumbbells,Dumbbell Heels Up Narrow Goblet Squat
Glutes,Dumbbells,Dumbbell Hip Thrust
Glutes,Dumbbells,Dumbbell Kickstand Squat
Glutes,Dumbbells,Dumbbell Lateral Lunge Reach
Glutes,Dumbbells,Dumbbell Offset Squat
Glutes,Dumbbells,Dumbbell Overhead Squat
Glutes,Dumbbells,Dumbbell Reverse Lunge
Glutes,Dumbbells,Dumbbell Side Step Up
Glutes,Dumbbells,Dumbbell Single Arm Front Rack Step Up
Glutes,Dumbbells,Dumbbell Single Arm Step Up
Glutes,Dumbbells,Dumbbell Single Leg Glute Bridge
Glutes,Dumbbells,Dumbbell Single Leg Heels Elevated Hip Thrust
Glutes,Dumbbells,Dumbbell Single Leg Hip Thrust
Glutes,Dumbbells,Dumbbell Split Squat
Glutes,Dumbbells,Dumbbell Staggered Glute Bridge
Glutes,Dumbbells,Dumbbell Staggered Hip Thrust
Glutes,Dumbbells,Dumbbell Standing Hip Abduction
Glutes,Dumbbells,Dumbbell Step Up
Glutes,Dumbbells,Dumbbell Thruster
Glutes,Dumbbells,Single Arm Overhead Squat
Glutes,Machine,Machine Hack Squat
Glutes,Machine,Machine Hip Abduction
Glutes,Machine,Machine Hip And Glute Abduction
Glutes,Machine,Machine Hip And Glute Kickback
Glutes,Machine,Machine Hip Thrust
Glutes,Machine,Machine Horizontal Leg Press
Glutes,Machine,Machine Horizontal Sissy Leg Press
Glutes,Machine,Machine Leg Press
Glutes,Smith Machine,Smith Machine Glute Kickback
Glutes,Smith Machine,Smith Machine Hip Thrust
Glutes,Smith Machine,Smith Machine Leg Press
Glutes,Smith Machine,Smith Machine Narrow Stance Squat
Glutes,Smith Machine,Smith Machine Reverse Lunge
Glutes,Smith Machine,Smith Machine Single Leg Hip Thrust
Glutes,Smith Machine,Smith Machine Split Squat
Glutes,Smith Machine,Smith Machine Squat
Hamstrings,Bodyweight,Bodyweight Reverse Lunge
Hamstrings,Bodyweight,Hamstring Curl 1 Supine Single Leg Slider
Hamstrings,Bodyweight,Hamstring Curl 2 Supine Single Leg Slider
Hamstrings,Bodyweight,Hamstring Curl Eccentric Supine Bilateral Sliders
Hamstrings,Bodyweight,Hamstring Curl Standing Bodyweight Single Leg
Hamstrings,Bodyweight,Hamstring Curl Standing Isometric Bodyweight Single Leg
Hamstrings,Bodyweight,Hamstring Curl Supine Bilateral Slider
Hamstrings,Bodyweight,Nordic Hamstring Curl
Hamstrings,Cables,Cable Hamstring Curl
Hamstrings,Cables,Cable Seated Leg Curl
Hamstrings,Cables,Cable Single Leg Laying Leg Curl
Hamstrings,Dumbbells,Dumbbell Leg Curl
Hamstrings,Machine,Glute Ham Raise
Hamstrings,Machine,Machine Hamstring Curl
Hamstrings,Machine,Machine Seated Leg Curl
Hamstrings,Machine,Seated Leg Curl
Lower_Back,Barbell,Barbell Coan Deadlift
Lower_Back,Barbell,Barbell High Bar Good Morning
Lower_Back,Barbell,Barbell Low Bar Good Morning
Lower_Back,Barbell,Barbell Low Bar Squat
Lower_Back,Barbell,Barbell Pause Box Squat
Lower_Back,Barbell,Barbell Pause Squat
Lower_Back,Barbell,Barbell Reverse Deadlift
Lower_Back,Barbell,Barbell Romanian Deadlift
Lower_Back,Barbell,Barbell Single Leg Deadlift
Lower_Back,Barbell,Barbell Snatch Grip Deadlift
Lower_Back,Barbell,Barbell Snatch Grip Romanian Deadlift
Lower_Back,Barbell,Barbell Staggered Deadlift
Lower_Back,Barbell,Barbell Suitcase Deadlift
Lower_Back,Barbell,Barbell Sumo Deadlift
Lower_Back,Barbell,Barbell Zercher Good Morning
Lower_Back,Barbell,Barbell Zercher Squat
Lower_Back,Barbell,Landmine Romanian Deadlift
Lower_Back,Barbell,Landmine Single Leg Romanian Deadlift
Lower_Back,Barbell,Landmine Snatch
Lower_Back,Barbell,Landmine Staggered Romanian Deadlift
Lower_Back,Bodyweight,Good Mornings
Lower_Back,Bodyweight,Single Legged Romanian Deadlifts
Lower_Back,Bodyweight,Supermans
Lower_Back,Cables,Cable Bar Romanian Deadlift
Lower_Back,Cables,Cable Bar Staggered Romanian Deadlift
Lower_Back,Cables,Cable Bench Straight Leg Kickback
Lower_Back,Cables,Cable Elevated Deadlift
Lower_Back,Cables,Cable Goblet Squat
Lower_Back,Cables,Cable Incline Bench Straight Leg Kickback
Lower_Back,Cables,Cable Pull Through
Lower_Back,Cables,Cable Single Leg Deadlift
Lower_Back,Cables,Cable Standing Mid Kickback
Lower_Back,Cables,Cable Standing Straight Leg Glute Glute Kickback
Lower_Back,Cables,Cable Standing Straight Leg Mid Kickback
Lower_Back,Cables,Cable Zercher Good Morning
Lower_Back,Cables,Cable Zercher Squat
Lower_Back,Dumbbells,Dumbbell Cross Body Romanian Deadlift
Lower_Back,Dumbbells,Dumbbell Front Rack Pause Squat
Lower_Back,Dumbbells,Dumbbell Goblet Good Morning
Lower_Back,Dumbbells,Dumbbell Romanian Deadlift
Lower_Back,Dumbbells,Dumbbell Single Leg Single Arm Deadlift
Lower_Back,Dumbbells,Dumbbell Single Leg Stiff Leg Deadlift
Lower_Back,Dumbbells,Dumbbell Staggered Deadlift
Lower_Back,Dumbbells,Dumbbell Sumo Squat
Lower_Back,Dumbbells,Dumbbell Superman
Lower_Back,Dumbbells,Dumbbell Superman Hold
Lower_Back,Dumbbells,Dumbbell Swing
Lower_Back,Machine,Machine 45 Degree Back Extension
Lower_Back,Smith Machine,Smith Machine Romanian Deadlift
Lower_Back,Smith Machine,Smith Machine Staggered Deadlift
Lower_Back,Smith Machine,Smith Machine Sumo Romanian Deadlift
Quadriceps,Barbell,Barbell Front Squat Olympic
Quadriceps,Barbell,Barbell Landmine Sissy Squat
Quadriceps,Bodyweight,Bodyweight Reverse Step Up
Quadriceps,Bodyweight,Bodyweight Squat
Quadriceps,Cables,Cable Seated Leg Extension
Quadriceps,Cables,Cable Standing Leg Extension
Quadriceps,Dumbbells,Dumbbell Leg Extension
Quadriceps,Machine,Machine Goblet Sissy Squat
Quadriceps,Machine,Machine Hip Adduction
Quadriceps,Machine,Machine Hip And Glute Adduction
Quadriceps,Machine,Machine Leg Extension
Quadriceps,Machine,Machine Sissy Squat
Quadriceps,Smith Machine,Smith Machine Sissy Squat
Shoulders,Barbell,Barbell Behind The Neck Seated Overhead Press
Shoulders,Barbell,Barbell Front Raise
Shoulders,Barbell,Barbell High Incline Bench Press
Shoulders,Barbell,Barbell Incline Bench Press
Shoulders,Barbell,Barbell Overhead Press
Shoulders,Barbell,Barbell Upright Row
Shoulders,Barbell,Barbell Z Press
Shoulders,Barbell,Landmine Alternating Single Arm Press
Shoulders,Barbell,Landmine Half Kneeling Single Arm Overhead Press
Shoulders,Barbell,Landmine Kneeling Alternating Overhead Press
Shoulders,Barbell,Landmine Kneeling Overhead Press
Shoulders,Barbell,Landmine Lateral Raise
Shoulders,Barbell,Landmine Overhead Press
Shoulders,Barbell,Landmine Seated Alternating Overhead Press
Shoulders,Barbell,Landmine Seated Overhead Press
Shoulders,Barbell,Landmine Seated Single Arm Overhead Press
Shoulders,Barbell,Landmine Single Arm Overhead Press
Shoulders,Barbell,Landmine Single Arm Push Press
Shoulders,Barbell,Landmine Single Arm Staggered Overhead Press
Shoulders,Barbell,Landmine Split Jerk
Shoulders,Bodyweight,Backward Arm Circle
Shoulders,Bodyweight,Forward Arm Circle
Shoulders,Bodyweight,Ring Rear Delt Fly
Shoulders,Bodyweight,Ring Standing Pushup
Shoulders,Cables,Cable Bar Front Raise
Shoulders,Cables,Cable Bench Press
Shoulders,Cables,Cable Chest Press
Shoulders,Cables,Cable Decline Bench Press
Shoulders,Cables,Cable Decline Single Arm Bench Press
Shoulders,Cables,Cable High Internally Rotated Reverse Fly
Shoulders,Cables,Cable High Reverse Fly
Shoulders,Cables,Cable High Single Arm Rear Delt Fly
Shoulders,Cables,Cable Low Bilateral Lateral Raise
Shoulders,Cables,Cable Low Single Arm Lateral Raise
Shoulders,Cables,Cable Overhead Press
Shoulders,Cables,Cable Rope Front Raise
Shoulders,Cables,Cable Rope Kneeling Face Pull
Shoulders,Cables,Cable Rope Mid Lateral Raise
Shoulders,Cables,Cable Rope Single Arm Low Lateral Raise
Shoulders,Cables,Cable Rope Upright Row
Shoulders,Cables,Cable Single Arm Bench Press
Shoulders,Cables,Cable Single Arm Internally Rotated High Reverse Fly
Shoulders,Cables,Cable Upright Row
Shoulders,Cables,Machine Face Pulls
Shoulders,Dumbbells,Dumbbell Alternating Arnold Press
Shoulders,Dumbbells,Dumbbell Alternating Overhead Press
Shoulders,Dumbbells,Dumbbell Arnold Press
Shoulders,Dumbbells,Dumbbell Bayesian Lateral Raise
Shoulders,Dumbbells,Dumbbell Bent Arm Lateral Raise
Shoulders,Dumbbells,Dumbbell Front Raise
Shoulders,Dumbbells,Dumbbell High Incline Bench Press
Shoulders,Dumbbells,Dumbbell Incline Bench Press
Shoulders,Dumbbells,Dumbbell Incline Chest Flys
Shoulders,Dumbbells,Dumbbell Internally Rotated Rear Delt Fly
Shoulders,Dumbbells,Dumbbell Lateral Raise
Shoulders,Dumbbells,Dumbbell Laying Reverse Fly
Shoulders,Dumbbells,Dumbbell Laying Reverse Fly Internally Rotated
Shoulders,Dumbbells,Dumbbell Neutral Alternating Overhead Press
Shoulders,Dumbbells,Dumbbell Neutral Bench Press
Shoulders,Dumbbells,Dumbbell Neutral Incline Bench Press
Shoulders,Dumbbells,Dumbbell Neutral Overhead Press
Shoulders,Dumbbells,Dumbbell Neutral Seated Overhead Press
Shoulders,Dumbbells,Dumbbell Overhead Press
Shoulders,Dumbbells,Dumbbell Push Press
Shoulders,Dumbbells,Dumbbell Rear Delt Fly
Shoulders,Dumbbells,Dumbbell Seated Arnold Press
Shoulders,Dumbbells,Dumbbell Seated Overhead Press
Shoulders,Dumbbells,Dumbbell Seated Rear Delt Fly
Shoulders,Dumbbells,Dumbbell Shoulder External Rotation
Shoulders,Dumbbells,Dumbbell Single Arm Arnold Press
Shoulders,Dumbbells,Dumbbell Single Arm Neutral Overhead Press
Shoulders,Dumbbells,Dumbbell Single Arm Overhead Press
Shoulders,Dumbbells,Dumbbell Single Arm Upright Row
Shoulders,Dumbbells,Dumbbell Standing Bayesian Lateral Raise
Shoulders,Dumbbells,Dumbbell Upright Row
Shoulders,Dumbbells,Internally Rotated Seated Rear Delt Fly
Shoulders,Dumbbells,Laying Lateral Raise
Shoulders,Dumbbells,Seated Lateral Raise
Shoulders,Machine,Machine Neutral Overhead Press
Shoulders,Machine,Machine Overhand Overhead Press
Shoulders,Machine,Machine Overhand Row
Shoulders,Machine,Machine Reverse Fly
Shoulders,Smith Machine,Smith Machine Bench Press
Shoulders,Smith Machine,Smith Machine Incline Bench Press
Shoulders,Smith Machine,Smith Machine Seated Overhead Press
Shoulders,Smith Machine,Smith Machine Upright Row
Trapezius,Barbell,Barbell Deadlift
Trapezius,Barbell,Barbell Shrug
Trapezius,Barbell,Barbell Silverback Shrug
Trapezius,Bodyweight,Bodyweight Overhand Inverted Row
Trapezius,Bodyweight,Bodyweight Pike Press
Trapezius,Bodyweight,Bodyweight Pike Shrug
Trapezius,Bodyweight,Bodyweight Standing Inverted Row
Trapezius,Bodyweight,Elevated Pike Press
Trapezius,Bodyweight,Elevated Pike Shoulder Shrug
Trapezius,Bodyweight,Inverted Row
Trapezius,Bodyweight,Pull Ups
Trapezius,Cables,Cable 30 Degree Shrug
Trapezius,Cables,Cable Silverback Shrug
Trapezius,Cables,Cable Single Arm 30 Degree Shrug
Trapezius,Cables,Cable Single Arm Rear Delt Row
Trapezius,Dumbbells,Dumbbell Laying 30 Degree Shrug
Trapezius,Dumbbells,Dumbbell Laying Silverback Shrug
Trapezius,Dumbbells,Dumbbell Row Bilateral
Trapezius,Dumbbells,Dumbbell Row Unilateral
Trapezius,Dumbbells,Dumbbell Seated Rear Delt Row
Trapezius,Dumbbells,Dumbbell Seated Shrug
Trapezius,Dumbbells,Dumbbell Shrug
Trapezius,Dumbbells,Dumbbell Silverback Shrug
Trapezius,Machine,Smith Machine Standing Shrugs
Trapezius,Smith Machine,Smith Machine Assisted Pullup
Trapezius,Smith Machine,Smith Machine Inverted Row
Triceps,Barbell,Barbell Close Grip Bench Press
Triceps,Barbell,Barbell Floor Press
Triceps,Barbell,Barbell Laying Triceps Extensions
Triceps,Barbell,Barbell Overhead Tricep Extension
Triceps,Barbell,Barbell Skullcrusher
Triceps,Barbell,Barbell Spoto Press
Triceps,Barbell,Landmine Lying Tricep Extension
Triceps,Barbell,Landmine Single Arm Chest Press
Triceps,Bodyweight,Bench Dips
Triceps,Bodyweight,Bodyweight Box Assisted Dips
Triceps,Bodyweight,Bodyweight Clapping Push Up
Triceps,Bodyweight,Bodyweight Diamond Knee Push Ups
Triceps,Bodyweight,Bodyweight Elevated Push Up
Triceps,Bodyweight,Bodyweight Explosive Push Up
Triceps,Bodyweight,Bodyweight Incline Knee Push Up
Triceps,Bodyweight,Bodyweight Knee Push Ups
Triceps,Bodyweight,Bodyweight Knee Tricep Extension
Triceps,Bodyweight,Bodyweight Tricep Extension
Triceps,Bodyweight,Box Dips
Triceps,Bodyweight,Decline Push Up
Triceps,Bodyweight,Diamond Push Ups
Triceps,Bodyweight,Dips Narrow Elbows
Triceps,Bodyweight,Incline Push Up
Triceps,Bodyweight,Parralel Bar Dips
Triceps,Bodyweight,Ring Skullcrusher
Triceps,Bodyweight,Ring Standing Archer Pushup
Triceps,Cables,Cable Bar Pushdown
Triceps,Cables,Cable Bar Reverse Grip Pushdown
Triceps,Cables,Cable Cross Pushdown
Triceps,Cables,Cable Rope Overhead Tricep Extension
Triceps,Cables,Cable Rope Pushdown
Triceps,Cables,Cable Rope Skullcrusher
Triceps,Cables,Cable Single Arm Cross Pushdown
Triceps,Cables,Cable Single Arm Incline Bench Press
Triceps,Cables,Cable Single Arm Rope Pushdown
Triceps,Cables,Cable Single Arm Skullcrusher
Triceps,Cables,Cable Tricep Kickback
Triceps,Dumbbells,Dumbbell Alternating Single Arm Press
Triceps,Dumbbells,Dumbbell Bench Press
Triceps,Dumbbells,Dumbbell Decline Alternating Single Arm Press
Triceps,Dumbbells,Dumbbell Decline Bench Press
Triceps,Dumbbells,Dumbbell Decline Guillotine Bench Press
Triceps,Dumbbells,Dumbbell Decline Single Arm Bench Press
Triceps,Dumbbells,Dumbbell Decline Skullcrusher
Triceps,Dumbbells,Dumbbell Decline Squeeze Press
Triceps,Dumbbells,Dumbbell Elevated Pushup
Triceps,Dumbbells,Dumbbell Floor Press
Triceps,Dumbbells,Dumbbell Guillotine Bench Press
Triceps,Dumbbells,Dumbbell Guillotine Incline Bench Press
Triceps,Dumbbells,Dumbbell Incline Skullover
Triceps,Dumbbells,Dumbbell Overhead Tricep Extension
Triceps,Dumbbells,Dumbbell Rolling Tricep Extension
Triceps,Dumbbells,Dumbbell Seated Overhead Tricep Extension
Triceps,Dumbbells,Dumbbell Single Arm Overhead Tricep Extension
Triceps,Dumbbells,Dumbbell Single Arm Press
Triceps,Dumbbells,Dumbbell Skullcrusher
Triceps,Dumbbells,Dumbbell Squeeze Press
Triceps,Dumbbells,Dumbbell Tate Press
Triceps,Dumbbells,Dumbbell Tricep Kickback
Triceps,Machine,Machine Assisted Parralel Bar Dips
Triceps,Machine,Machine Cable V Bar Push Downs
Triceps,Machine,Machine Chest Press
Triceps,Machine,Neutral Chest Press
Triceps,Smith Machine,Smith Machine Bodyweight Skullcrusher
Triceps,Smith Machine,Smith Machine Close Grip Bench Press
Triceps,Smith Machine,Smith Machine Guillotine Bench Press
Triceps,Smith Machine,Smith Machine Skullcrusher
Upper_Back,Cables,Cable Bent Over Bar Pullover
Upper_Back,Cables,Cable Lat Prayer
Upper_Back,Cables,Cable Rope Lat Prayer
Upper_Back,Cables,Cable Rope Pullover
Upper_Back,Cables,Cable Straight Arm Pull In
Upper_Back,Dumbbells,Dumbbell Pullover
Upper_Back,Dumbbells,Dumbbell Shoulder Extension
Upper_Back,Machine,Machine Neutral Row
Upper_Back,Machine,Machine Pulldown
Upper_Back,Machine,Stretcher";

    // Parse CSV data
    $rows = array_map('str_getcsv', explode("\n", $csvData));
    $headers = array_shift($rows); // Remove the header row
    
    // Get unique muscle groups and equipment
    $muscleGroups = [];
    $equipmentTypes = [];
    
    foreach ($rows as $row) {
        if (count($row) === 3) { // Skip empty rows
            $muscleGroup = trim($row[0]);
            $equipment = trim($row[1]);
            
            if (!empty($muscleGroup) && !in_array($muscleGroup, $muscleGroups)) {
                $muscleGroups[] = $muscleGroup;
            }
            
            if (!empty($equipment) && !in_array($equipment, $equipmentTypes)) {
                $equipmentTypes[] = $equipment;
            }
        }
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Insert muscle groups
        $muscleGroupIds = [];
        foreach ($muscleGroups as $muscleGroup) {
            $db->query("INSERT IGNORE INTO muscle_groups (name) VALUES (:name)");
            $db->bind(':name', $muscleGroup);
            $db->execute();
            
            $db->query("SELECT id FROM muscle_groups WHERE name = :name");
            $db->bind(':name', $muscleGroup);
            $result = $db->single();
            
            $muscleGroupIds[$muscleGroup] = $result['id'];
        }
        
        // Insert equipment types
        $equipmentIds = [];
        foreach ($equipmentTypes as $equipment) {
            $db->query("INSERT IGNORE INTO equipment (name) VALUES (:name)");
            $db->bind(':name', $equipment);
            $db->execute();
            
            $db->query("SELECT id FROM equipment WHERE name = :name");
            $db->bind(':name', $equipment);
            $result = $db->single();
            
            $equipmentIds[$equipment] = $result['id'];
        }
        
        // Insert exercises
        $exerciseCount = 0;
        foreach ($rows as $row) {
            if (count($row) === 3) { // Skip empty rows
                $muscleGroup = trim($row[0]);
                $equipment = trim($row[1]);
                $exerciseName = trim($row[2]);
                
                if (empty($muscleGroup) || empty($equipment) || empty($exerciseName)) {
                    continue;
                }
                
                $muscleGroupId = $muscleGroupIds[$muscleGroup];
                $equipmentId = $equipmentIds[$equipment];
                
                $db->query("INSERT IGNORE INTO exercises (muscle_group_id, equipment_id, name) 
                            VALUES (:muscle_group_id, :equipment_id, :name)");
                $db->bind(':muscle_group_id', $muscleGroupId);
                $db->bind(':equipment_id', $equipmentId);
                $db->bind(':name', $exerciseName);
                
                $result = $db->execute();
                if ($result) {
                    $exerciseCount++;
                }
            }
        }
        
        // Commit transaction
        $db->commit();
        
        return [
            'success' => true, 
            'message' => "Import successful: Added " . count($muscleGroupIds) . " muscle groups, " . 
                        count($equipmentIds) . " equipment types, and " . $exerciseCount . " exercises."
        ];
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        return ['success' => false, 'message' => 'Import failed: ' . $e->getMessage()];
    }
}

/**
 * Run the import if this script is executed directly
 */
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    $result = importExerciseLibrary();
    echo $result['message'];
}