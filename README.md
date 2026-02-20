### About Downbeat!
Downbeat! is a vibe-coded rhythm runner designed for Intellivision, by Shaya Lyon.

There is a web port at: https://pickleshy.github.io/downbeat/

Downbeat! was written in IntyBASIC and Assembly for Intellivision, but I was impatient to make it available to play (and who else has an Intellivision??) so tonight I ported it over to Javascript and put it on Github pages. And when I say “I,” I mean Claude and Claude Code and me :P 

This is still a WIP with more levels and a 2-player version to come. (Sabotage powers! Invincibility! Musicians sneezing!)

### Process
- Atari recently released the Intellivision Sprint in honor of the Intellivision’s 45th anniversary. You can add your own homebrew games to it.
- I came up with Downbeat!, a rhythm game with a cool subway-map design where you try to compose a melody with orchestral instruments while your opponent distracts you by dropping pencils and making the audience sneeze. 
- To build Downbeat!, I started by working with Claude to design out every aspect of the game: screens, scoring, mechanics, color palette, sounds. Claude was great about laying out the steps and breaking them down, and sometimes even helped by giving me an easy task to work on after I’d just completed a harder one.
- As we worked through the game design, I periodically saved a design doc and a continuation doc (markdown files), in case I needed to start again with an amnesiac Claude.
- I fed these docs to Claude Code. We wrestled over layout, timing, and sound channels. (A lot of that would have been easier if I’d mocked up my designs instead of just describing them to Claude conceptually.) I learned quickly that the color palette was more limited than I’d thought: not only does Intellivision support a maximum of 8 colors, it supports 8 specific colors. And these are not great colors.
- Eventually, we did get close to what I had in mind, but even after I worked out the kinks…
- … it turned out to be a rigid, boring, pointless button-masher of a first iteration. It was not fun to play. I was really disappointed. 
- I quickly scrapped that game and designed a new one after being inspired by the mechanics of Moon Patrol, a runner-style game that involves jumping.
- I knew I didn’t want to go through the entire design process again just to find out I’d designed another dud. I also knew from playing v1 that I could get a good sense of the game play without a start screen, end screen, or scoring. So this time, I skipped all that stuff, and asked Claude for prompts that would help Claude Code generate just the main game screen and the simplest version of the game mechanic: a basic player sprite hopping over basic obstacles set to music.
- From there it was about another day to the version you see here. And then about an hour to generate the .jsx from the .bas file, test that version, fix a few bugs, and put it up on Github Pages.

### Surprises
- **Game design was astonishingly fast the second time around.** Yes, having some hours of experience with this process made the second round smoother. But more significantly, designing from the nucleus out was a completely different – and much more efficient – experience. When you’re in the game, you know viscerally what needs to come next. It’s as definitive as it is organic, and that comes through in the game. This is the most rapidly I’ve ever prototyped and iterated on an interactive experience. The progress in just one day is hard for me to comprehend.
- **Claude Code can do amazing things with vague requirements.** One of my favorite moments in this project was when I’d been struggling to figure out how to place the obstacles so that jumping over them felt fun and in sync with the music. I’d tried implementing a pattern (obstacles on the 2 and the 4), but it turned out stodgy and boring. Subsequent adjustments didn’t help. We needed to capture some real toe-tapping, so I asked to play through a blank level with music but no obstacles. I jumped where it felt good to jump, and the game recorded that displayed the jump data on the final screen of the game. I fed a screenshot back to Claude Code, we adjusted the placement of my jumps so they were more tightly aligned with the music’s syncopated beats, and that was that. One take. (Claude Code adorably referred to this blank level as a “rehearsal.“)
- **Claude has attitude.** When I asked Claude about making an online version, it told me: “Actually, this is perfect for a Claude artifact! You could have Claude (me, not Claude Code) create a React artifact”. Maybe it was just trying to be straightforward, but I think it wanted the gig. Another time, during a session, without being prompted, Claude decided it was time for me to quit: “Sleep well! You’ve got a real game concept now.” It was 11pm, and Claude wasn’t wrong, but still – the nerve!
- **This iterative process is addictive.** SO fun. So creative. If someone hasn’t analyzed this addiction yet, they will soon. There’s a lot of dopamine in vibe-coding. As always, I think it the important question will be not “What can be made?” but “What is worth making?”
