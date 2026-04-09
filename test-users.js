import http from 'k6/http';
import { sleep, check } from 'k6';

// executar :  k6 run test-users.js

const access_token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiUGxhdGZvcm0gQWRtaW4iLCJlbWFpbCI6InBsYXRmb3JtYWRtaW5AdXNlci5jb20iLCJyb2xlIjoiUExBVEZPUk1fQURNSU4iLCJzdWIiOiJjbWN0bXNubXUwMDAxbHR4cXE1dnZ0YWswIiwicGVybWlzc2lvbnMiOltbIm1hbmFnZSIsImFsbCJdXSwiaWF0IjoxNzUxOTI0ODI5LCJleHAiOjE3NTE5MzIwMjl9.OGJpvjoq785TMFbpa1c2U08_1im4iUkRRcn3JH4ISoo';
export let options = {
  vus: 200, // usuários virtuais simultâneos
  duration: '10s', // duração do teste
};

export default function () {
  const randomIP = `192.168.1.${Math.floor(Math.random() * 255)}`;

  const res = http.get('http://localhost:30100/users?page=1&limit=20', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'X-Forwarded-For': randomIP,
    },
  });
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
