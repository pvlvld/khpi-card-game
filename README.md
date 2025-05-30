<p align="center">
<img src="https://github.com/pvlvld/khpi-card-game/blob/main/assets/AceHole-logo.png"</img>
</p>

## Description
  <p align="center">Simple turn based card game like Gwent / Hearthstone.</p>
  <p>Built using:
    <ul>
      <li><a href="http://nodejs.org" target="_blank">Node.js</a></li>
      <li><a href="https://nestjs.com/" target="_blank">Nest.js</a></li>
      <li><a href="https://socket.io/" target="_blank">Socket.IO</a></li>
      <li><a href="https://react.dev/" target="_blank">React.js</a></li>
      <li><a href="https://www.typescriptlang.org/" target="_blank">TypeScript</a></li>
      <li><a href="https://jwt.io/" target="_blank">JWT</a></li>
      <li><a href="https://www.mysql.com/" target="_blank">MySQL</a></li>
      <li><a href="https://www.docker.com/" target="_blank">Docker</a></li>
    </ul>
  </p>

  <p>You can check the project presentation here: <a href="https://drive.google.com/file/d/1taWCc2RVPy1lwjAUHKR2p-sYRkU1T1H1/view?usp=drive_link">*click*</a></p>

## Project setup

```bash
$ git clone https://github.com/pvlvld/khpi-card-game backend
$ git clone $ git clone https://github.com/pvlvld/khpi-card-game frontend
$ cd backend && npm i && npx prisma generate && cd ..
$ cd frontend && npm i && cd ..
```
> Setup .env inside both the frontend and the backend. 

## Compile and run the project

```bash
$ docker-compose up
$ cd backend && npx prisma db push && npm run start:prod && cd ..
$ cd frontend && npm run dev && cd ..
```
> open localhost:PORT

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
